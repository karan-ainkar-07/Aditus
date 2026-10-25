import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Redis } from "@upstash/redis";
import twilio from "twilio";
import prisma from "../../lib/prisma.js";
import {
  ACCOUNT_STATUS,
  ACCOUNT_TYPE,
  SELF_REGISTER_ROLES,
  OTP_PURPOSE,
  OTP,
  LOGIN,
  PASSWORD,
  NAME,
  PHONE,
  TOKEN,
  REDIS_KEY,
} from "./auth.config.js";

export class AuthError extends Error {
  constructor(status, code, message, retryAfter) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

// ---------- infra ----------

// raw strings back, no auto json-parsing of hashes/flags
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  automaticDeserialization: false,
});

let twilioClient;
const getTwilio = () =>
  (twilioClient ??= twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN));

async function sendSms(to, body) {
  // no twilio creds in dev -> just print it
  if (!process.env.TWILIO_ACCOUNT_SID && process.env.NODE_ENV !== "production") {
    console.log(`[dev sms] ${to}: ${body}`);
    return;
  }
  await getTwilio().messages.create({
    to,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    body,
  });
}

const sha256 = (v) => crypto.createHash("sha256").update(v).digest("hex");
const otpHash = (v) => crypto.createHmac("sha256", process.env.OTP_HMAC_SECRET).update(v).digest("hex");

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// compared against when the phone is unknown, so timing doesn't leak who exists
const DUMMY_HASH = bcrypt.hashSync("dummy-password", PASSWORD.BCRYPT_ROUNDS);

// ---------- helpers ----------

export function normalizePhone(raw) {
  if (typeof raw !== "string") throw new AuthError(400, "INVALID_PHONE", "Invalid phone number");
  let p = raw.replace(/[\s\-()]/g, "");
  if (/^\d{10}$/.test(p)) p = PHONE.DEFAULT_COUNTRY_CODE + p;
  if (!PHONE.E164_REGEX.test(p)) throw new AuthError(400, "INVALID_PHONE", "Invalid phone number");
  return p;
}

function assertPassword(pw) {
  if (typeof pw !== "string" || pw.length < PASSWORD.MIN_LENGTH || pw.length > PASSWORD.MAX_LENGTH) {
    throw new AuthError(
      400,
      "INVALID_PASSWORD",
      `Password must be ${PASSWORD.MIN_LENGTH}-${PASSWORD.MAX_LENGTH} characters`
    );
  }
}

function assertName(name) {
  const n = typeof name === "string" ? name.trim() : "";
  if (n.length < NAME.MIN_LENGTH || n.length > NAME.MAX_LENGTH) {
    throw new AuthError(400, "INVALID_NAME", "Invalid name");
  }
  return n;
}

function assertPurpose(purpose) {
  if (!Object.values(OTP_PURPOSE).includes(purpose)) {
    throw new AuthError(400, "INVALID_PURPOSE", "Invalid OTP purpose");
  }
}

// walk-in stub that a patient can claim by registering
const isClaimableStub = (u) =>
  u.accountType === ACCOUNT_TYPE.PATIENT &&
  u.status === ACCOUNT_STATUS.PENDING_ACTIVATION &&
  !u.passwordHash;

// counter with a fixed window; SET NX EX first so the key always has a ttl
async function bump(key, windowSec) {
  const [, count] = await redis.pipeline().set(key, "0", { ex: windowSec, nx: true }).incr(key).exec();
  return Number(count);
}

async function requireVerified(purpose, phone) {
  const ok = await redis.get(REDIS_KEY.verified(purpose, phone));
  if (!ok) throw new AuthError(403, "PHONE_NOT_VERIFIED", "Verify your phone number first");
}

const clearVerified = (purpose, phone) => redis.del(REDIS_KEY.verified(purpose, phone));

async function issueSession(user, familyId = crypto.randomUUID(), db = prisma) {
  const accessToken = jwt.sign({ accountType: user.accountType }, process.env.ACCESS_TOKEN_SECRET, {
    subject: user.id,
    expiresIn: TOKEN.ACCESS_TTL_SEC,
    algorithm: "HS256",
  });
  const refreshToken = crypto.randomBytes(TOKEN.REFRESH_BYTES).toString("base64url");
  await db.refreshToken.create({
    data: {
      userId: user.id,
      familyId,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + TOKEN.REFRESH_TTL_MS),
    },
  });
  return { accessToken, refreshToken };
}

const revokeAllTokens = (userId, db = prisma) =>
  db.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

// ---------- OTP ----------

async function enforceOtpLimits(phone, purpose, ip) {
  const cdKey = REDIS_KEY.otpCooldown(purpose, phone);
  const got = await redis.set(cdKey, "1", { ex: OTP.RESEND_COOLDOWN_SEC, nx: true });
  if (!got) {
    const ttl = await redis.ttl(cdKey);
    throw new AuthError(429, "OTP_COOLDOWN", `Wait ${ttl}s before requesting another OTP`, ttl);
  }

  const phoneKey = REDIS_KEY.otpPhoneCap(phone);
  if ((await bump(phoneKey, OTP.CAP_WINDOW_SEC)) > OTP.PHONE_HOURLY_MAX) {
    const ttl = await redis.ttl(phoneKey);
    throw new AuthError(429, "OTP_LIMIT", "Too many OTP requests, try again later", ttl);
  }

  if (ip) {
    const ipKey = REDIS_KEY.otpIpCap(ip);
    if ((await bump(ipKey, OTP.CAP_WINDOW_SEC)) > OTP.IP_HOURLY_MAX) {
      const ttl = await redis.ttl(ipKey);
      throw new AuthError(429, "OTP_LIMIT", "Too many OTP requests, try again later", ttl);
    }
  }
}

export async function sendOtp({ phone, purpose, ip }) {
  phone = normalizePhone(phone);
  assertPurpose(purpose);
  await enforceOtpLimits(phone, purpose, ip);

  const user = await prisma.user.findUnique({ where: { phone } });

  if (purpose === OTP_PURPOSE.REGISTER && user && !isClaimableStub(user)) {
    throw new AuthError(409, "PHONE_TAKEN", "Phone number already registered");
  }

  // reset answers the same whether or not the account exists
  if (
    purpose === OTP_PURPOSE.PASSWORD_RESET &&
    (!user || !user.passwordHash || user.status !== ACCOUNT_STATUS.ACTIVE)
  ) {
    return { sent: true };
  }

  const otp = String(crypto.randomInt(0, 10 ** OTP.LENGTH)).padStart(OTP.LENGTH, "0");
  const key = REDIS_KEY.otp(purpose, phone);
  await redis
    .multi()
    .del(key)
    .hset(key, { h: otpHash(`${purpose}:${phone}:${otp}`), a: 0 })
    .expire(key, OTP.TTL_SEC)
    .exec();

  try {
    await sendSms(phone, `Your Aditus verification code is ${otp}. It is valid for 5 minutes.`);
  } catch (err) {
    console.error("otp sms failed:", err.message);
    await redis.del(key, REDIS_KEY.otpCooldown(purpose, phone));
    throw new AuthError(502, "SMS_FAILED", "Could not send OTP, try again");
  }
  return { sent: true };
}

export async function verifyOtp({ phone, purpose, otp }) {
  phone = normalizePhone(phone);
  assertPurpose(purpose);
  if (typeof otp !== "string" || !new RegExp(`^\\d{${OTP.LENGTH}}$`).test(otp)) {
    throw new AuthError(400, "INVALID_OTP", "Invalid OTP");
  }

  const key = REDIS_KEY.otp(purpose, phone);
  const stored = await redis.hget(key, "h");
  if (!stored) throw new AuthError(400, "OTP_EXPIRED", "OTP expired or not requested");

  const attempts = await redis.hincrby(key, "a", 1);
  if (attempts > OTP.MAX_VERIFY_ATTEMPTS) {
    await redis.del(key);
    throw new AuthError(429, "OTP_ATTEMPTS", "Too many wrong attempts, request a new OTP");
  }

  if (!safeEqual(stored, otpHash(`${purpose}:${phone}:${otp}`))) {
    throw new AuthError(400, "OTP_INVALID", "Incorrect OTP");
  }

  await redis
    .multi()
    .del(key)
    .set(REDIS_KEY.verified(purpose, phone), "1", { ex: OTP.VERIFIED_TTL_SEC })
    .exec();
  return { verified: true };
}

// ---------- account ----------

export async function getMe(userId) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      accountType: true,
      status: true,
      membership: {
        select: { role: true, clinic: { select: { id: true, name: true, status: true } } },
      },
    },
  });
  if (!u) throw new AuthError(401, "INVALID_TOKEN", "Not authenticated");
  const { membership: m } = u;
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    accountType: u.accountType,
    status: u.status,
    clinic: m ? { id: m.clinic.id, name: m.clinic.name, status: m.clinic.status, role: m.role } : null,
  };
}

export async function register({ phone, password, name, role }) {
  phone = normalizePhone(phone);
  const accountType = SELF_REGISTER_ROLES[role];
  if (!accountType) throw new AuthError(400, "INVALID_ROLE", "Invalid role");
  assertPassword(password);
  name = assertName(name);
  await requireVerified(OTP_PURPOSE.REGISTER, phone);

  const passwordHash = await bcrypt.hash(password, PASSWORD.BCRYPT_ROUNDS);
  const now = new Date();

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { phone } });
      if (existing) {
        // only a patient can claim a walk-in stub
        if (accountType !== ACCOUNT_TYPE.PATIENT || !isClaimableStub(existing)) {
          throw new AuthError(409, "PHONE_TAKEN", "Phone number already registered");
        }
        return tx.user.update({
          where: { id: existing.id },
          data: { name, passwordHash, status: ACCOUNT_STATUS.ACTIVE, phoneVerifiedAt: now },
        });
      }
      return tx.user.create({
        data: {
          name,
          phone,
          passwordHash,
          accountType,
          status: ACCOUNT_STATUS.ACTIVE,
          phoneVerifiedAt: now,
          ...(accountType === ACCOUNT_TYPE.PATIENT && { patientInfo: { create: {} } }),
        },
      });
    });
  } catch (err) {
    if (err.code === "P2002") throw new AuthError(409, "PHONE_TAKEN", "Phone number already registered");
    throw err;
  }

  await clearVerified(OTP_PURPOSE.REGISTER, phone);
  const session = await issueSession(user);
  return { ...session, user: await getMe(user.id) };
}

export async function login({ phone, password }) {
  phone = normalizePhone(phone);
  if (typeof password !== "string" || !password || password.length > PASSWORD.MAX_LENGTH) {
    throw new AuthError(401, "INVALID_CREDENTIALS", "Invalid phone or password");
  }

  const failKey = REDIS_KEY.loginFail(phone);
  if ((Number(await redis.get(failKey)) || 0) >= LOGIN.MAX_FAILS) {
    const ttl = await redis.ttl(failKey);
    throw new AuthError(429, "LOGIN_LOCKED", "Too many attempts, try again later", ttl);
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.passwordHash || !match || user.status !== ACCOUNT_STATUS.ACTIVE) {
    await bump(failKey, LOGIN.WINDOW_SEC);
    throw new AuthError(401, "INVALID_CREDENTIALS", "Invalid phone or password");
  }

  await redis.del(failKey);
  const session = await issueSession(user);
  return { ...session, user: await getMe(user.id) };
}

export async function refresh(rawToken) {
  const fail = () => new AuthError(401, "INVALID_REFRESH", "Session expired, log in again");
  if (!rawToken) throw fail();

  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!row || row.expiresAt < new Date()) throw fail();

  if (row.revokedAt) {
    // an old token showing up again past the grace window means it leaked -> kill the family
    if (Date.now() - row.revokedAt.getTime() > TOKEN.REFRESH_REUSE_GRACE_MS) {
      await prisma.refreshToken.updateMany({
        where: { familyId: row.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw fail();
  }

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) throw fail();

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.refreshToken.updateMany({
      where: { id: row.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw fail();
    return issueSession(user, row.familyId, tx);
  });
}

export async function logout(rawToken) {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// resolves the access cookie to a live user; clinic status is left to authorization
export async function authenticateToken(token) {
  const unauth = () => new AuthError(401, "INVALID_TOKEN", "Not authenticated");
  if (!token) throw unauth();

  let payload;
  try {
    payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw unauth();
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      accountType: true,
      status: true,
      membership: { select: { clinicId: true, role: true, clinic: { select: { status: true } } } },
    },
  });
  if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) throw unauth();

  return {
    userId: user.id,
    accountType: user.accountType,
    membership: user.membership
      ? { clinicId: user.membership.clinicId, role: user.membership.role, clinicStatus: user.membership.clinic.status }
      : null,
  };
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  assertPassword(newPassword);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const ok =
    user?.passwordHash &&
    typeof currentPassword === "string" &&
    (await bcrypt.compare(currentPassword, user.passwordHash));
  if (!ok) throw new AuthError(400, "WRONG_PASSWORD", "Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD.BCRYPT_ROUNDS);
  // every device is logged out, this one gets a fresh session
  return prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await revokeAllTokens(userId, tx);
    return issueSession(user, crypto.randomUUID(), tx);
  });
}

export async function resetPassword({ phone, newPassword }) {
  phone = normalizePhone(phone);
  assertPassword(newPassword);
  await requireVerified(OTP_PURPOSE.PASSWORD_RESET, phone);

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.passwordHash || user.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AuthError(400, "RESET_NOT_ALLOWED", "Cannot reset password for this account");
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD.BCRYPT_ROUNDS);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await revokeAllTokens(user.id, tx);
  });

  await clearVerified(OTP_PURPOSE.PASSWORD_RESET, phone);
  await redis.del(REDIS_KEY.loginFail(phone));
  return { reset: true };
}