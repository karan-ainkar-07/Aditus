import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../../config/prisma.js";
import redis from "../../config/redis.js";
import twilio from "../../config/twilio.js";

import {
  otp,
  messages,
  accessToken as accessCfg,
  refreshToken as refreshCfg,
  rateLimit,
} from "./auth.config.js";

export class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

const phoneHash = (phone) =>
  crypto.createHash("sha256").update(phone).digest("hex");

const otpKey = (phone) => `aditus:otp:${phoneHash(phone)}`;
const attemptsKey = (phone) => `aditus:otp:attempts:${phoneHash(phone)}`;
const cooldownKey = (phone) => `aditus:otp:cooldown:${phoneHash(phone)}`;
const hourlyKey = (phone) => `aditus:otp:hourly:${phoneHash(phone)}`;
const loginKey = (phone) => `aditus:login:${phoneHash(phone)}`;

const hashOtp = (phone, code) => {
  const secret = process.env.OTP_HMAC_SECRET;

  if (!secret) {
    throw new Error("OTP_HMAC_SECRET is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${phone}:${code}`)
    .digest("hex");
};

const generateOtp = () =>
  crypto
    .randomInt(0, 10 ** otp.length)
    .toString()
    .padStart(otp.length, "0");

export const sendOtpCode = async (phone) => {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!messagingServiceSid) {
    throw new Error("TWILIO_MESSAGING_SERVICE_SID is not configured");
  }

  const cooldownExists = await redis.get(cooldownKey(phone));

  if (cooldownExists) {
    throw new AuthError("Please wait before requesting another OTP", 429);
  }

  const sends = await redis.incr(hourlyKey(phone));

  if (sends === 1) {
    await redis.expire(hourlyKey(phone), 3600);
  }

  if (sends > otp.maxSendsPerHour) {
    throw new AuthError("OTP request limit reached. Try again later.", 429);
  }

  const code = generateOtp();
  const key = otpKey(phone);

  await redis.set(key, hashOtp(phone, code), { ex: otp.ttlSeconds });
  await redis.set(cooldownKey(phone), "1", { ex: otp.resendCooldownSeconds });

  try {
    // await twilio.messages.create({
    //   to: phone,
    //   messagingServiceSid,
    //   body:
    //     `Your Aditus verification code is ${code}. ` +
    //     `It expires in ${Math.ceil(otp.ttlSeconds / 60)} minute(s).`,
    // });
    console.log(`Your otp is ${code}`)

  } catch (error) {
    console.error("[twilio]", error);
    await redis.del(key);
    await redis.del(cooldownKey(phone));

    throw new AuthError(messages.smsSendFailed, 502);
  }

  return {
    message: messages.otpSent,
    expiresInSeconds: otp.ttlSeconds,
  };
};

const consumeOtp = async (phone, code) => {
  const script = `
    local stored = redis.call("GET", KEYS[1])

    if not stored then
      return -1
    end

    local attempts = redis.call("INCR", KEYS[2])

    if attempts == 1 then
      redis.call("EXPIRE", KEYS[2], ARGV[2])
    end

    if attempts > tonumber(ARGV[3]) then
      redis.call("DEL", KEYS[1])
      redis.call("DEL", KEYS[2])
      return -2
    end

    if stored ~= ARGV[1] then
      return 0
    end

    redis.call("DEL", KEYS[1])
    redis.call("DEL", KEYS[2])
    redis.call("DEL", KEYS[3])

    return 1
  `;

  const result = await redis.eval(
    script,
    [otpKey(phone), attemptsKey(phone), cooldownKey(phone)],
    [hashOtp(phone, code), otp.ttlSeconds, otp.maxAttempts]
  );

  if (Number(result) === 1) {
    return true;
  }

  if (Number(result) === -2) {
    throw new AuthError(messages.otpRateLimited, 429);
  }

  throw new AuthError(messages.invalidOtp, 400);
};

export const register = async ({ phone, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { phone } });

  if (existingUser) {
    throw new AuthError("Phone number already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      status: "PENDING_ACTIVATION",
    },
  });

  await sendOtpCode(phone);

  return {
    message: "Registration started. Please verify your phone.",
    userId: user.id,
  };
};

export const verifyOtp = async ({ phone, code }) => {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || user.status !== "PENDING_ACTIVATION") {
    throw new AuthError(messages.invalidOtp, 400);
  }

  await consumeOtp(phone, code);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { status: "ACTIVE" },
    });

    await tx.userRole.upsert({
      where: {
        userId_role: { userId: user.id, role: "PATIENT" },
      },
      create: { userId: user.id, role: "PATIENT" },
      update: {},
    });
  });

  return { message: messages.otpVerified };
};

export const resendOtp = async ({ phone }) => {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || user.status !== "PENDING_ACTIVATION") {
    throw new AuthError(
      "If the account is eligible, a verification code can be sent.",
      200
    );
  }

  return sendOtpCode(phone);
};

// ---------- Session / token logic ----------

const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (userId) =>
  jwt.sign({}, process.env.ACCESS_TOKEN_SECRET, {
    subject: userId,
    expiresIn: accessCfg.expiresIn,
    algorithm: "HS256",
  });

const issueRefreshToken = async (tx, { userId, familyId, meta }) => {
  const token = crypto.randomBytes(48).toString("base64url");

  const record = await tx.refreshToken.create({
    data: {
      userId,
      familyId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + refreshCfg.ttlSeconds * 1000),
      deviceInfo: meta?.userAgent ?? null,
      ipAddress: meta?.ip ?? null,
    },
  });

  return { token, record };
};

const revokeFamily = (familyId) =>
  prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

export const login = async ({ phone, password }, meta) => {
  const key = loginKey(phone);
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, rateLimit.loginWindowSeconds);
  }

  if (attempts > rateLimit.maxLoginAttempts) {
    throw new AuthError(messages.otpRateLimited, 429);
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  const valid = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH
  );

  if (!user || !valid) {
    throw new AuthError("Invalid phone or password", 401);
  }

  if (user.status === "SUSPENDED") {
    throw new AuthError("This account has been suspended", 401);
  }

  if (user.status !== "ACTIVE") {
    throw new AuthError("Phone number not verified", 403);
  }

  await redis.del(key);

  const { token } = await prisma.$transaction((tx) =>
    issueRefreshToken(tx, {
      userId: user.id,
      familyId: crypto.randomUUID(),
      meta,
    })
  );

  return {
    user: { id: user.id },
    accessToken: signAccessToken(user.id),
    refreshToken: token,
  };
};

export const refresh = async (rawToken, meta) => {
  if (!rawToken) {
    throw new AuthError("Refresh token required", 401);
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!stored) {
    throw new AuthError("Invalid refresh token", 401);
  }

  // Reuse detected: revoke the whole family
  if (stored.revokedAt) {
    await revokeFamily(stored.familyId);
    throw new AuthError("Invalid refresh token", 401);
  }

  if (stored.expiresAt <= new Date()) {
    throw new AuthError("Invalid refresh token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: { id: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    await revokeFamily(stored.familyId);
    throw new AuthError("Invalid refresh token", 401);
  }

  const next = await prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (claimed.count === 0) return null; // lost a race

    const issued = await issueRefreshToken(tx, {
      userId: stored.userId,
      familyId: stored.familyId,
      meta,
    });

    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { replacedById: issued.record.id },
    });

    return issued.token;
  });

  if (!next) {
    throw new AuthError("Invalid refresh token", 401);
  }

  return {
    accessToken: signAccessToken(stored.userId),
    refreshToken: next,
  };
};

export const logout = async (rawToken) => {
  if (!rawToken) return;

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (stored) await revokeFamily(stored.familyId);
};

export const me = async (userId) => {
  const [user, roles, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, status: true },
    }),
    prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    }),
    prisma.clinicMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        clinicId: true,
        role: true,
        clinic: { select: { status: true } },
      },
    }),
  ]);

  return {
    user,
    globalRoles: roles.map((r) => r.role),
    memberships,
  };
};