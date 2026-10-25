// auth constants

export const AUTH_BASE_PATH = "/api/auth";

export const ACCOUNT_TYPE = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  PATIENT: "PATIENT",
  CLINIC_STAFF: "CLINIC_STAFF",
};

export const ACCOUNT_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING_ACTIVATION: "PENDING_ACTIVATION",
  SUSPENDED: "SUSPENDED",
};

export const SELF_REGISTER_ROLES = {
  PATIENT: ACCOUNT_TYPE.PATIENT,
  CLINIC_ADMIN: ACCOUNT_TYPE.CLINIC_STAFF,
};

export const OTP_PURPOSE = {
  REGISTER: "REGISTER",
  PASSWORD_RESET: "PASSWORD_RESET",
};

export const OTP = {
  LENGTH: 6,
  TTL_SEC: 300,
  MAX_VERIFY_ATTEMPTS: 5,
  RESEND_COOLDOWN_SEC: 30,
  CAP_WINDOW_SEC: 3600,
  PHONE_HOURLY_MAX: 5,
  IP_HOURLY_MAX: 20,
  VERIFIED_TTL_SEC: 600,
};

export const LOGIN = {
  MAX_FAILS: 10,
  WINDOW_SEC: 900,
};

export const PASSWORD = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 72, 
  BCRYPT_ROUNDS: 10,
};

export const NAME = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100,
};

export const PHONE = {
  DEFAULT_COUNTRY_CODE: "+91",
  E164_REGEX: /^\+[1-9][0-9]{7,14}$/,
};

export const TOKEN = {
  ACCESS_TTL_SEC: 15 * 60,
  REFRESH_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  REFRESH_BYTES: 48,
  REFRESH_REUSE_GRACE_MS: 10 * 1000,
};

const isProd = process.env.NODE_ENV === "production";

export const COOKIE = {
  ACCESS_NAME: "access_token",
  REFRESH_NAME: "refresh_token",
  BASE: {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  },
};

export const REDIS_KEY = {
  otp: (purpose, phone) => `otp:${purpose}:${phone}`,
  otpCooldown: (purpose, phone) => `otp:cd:${purpose}:${phone}`,
  otpPhoneCap: (phone) => `otp:cap:phone:${phone}`,
  otpIpCap: (ip) => `otp:cap:ip:${ip}`,
  verified: (purpose, phone) => `verified:${purpose}:${phone}`,
  loginFail: (phone) => `login:fail:${phone}`,
};
