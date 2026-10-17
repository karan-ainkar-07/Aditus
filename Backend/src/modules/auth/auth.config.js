const otp = {
  length: 6,
  ttlSeconds: 300, 
  maxAttempts: 5,
  resendCooldownSeconds: 60,
  maxSendsPerHour: 5,
};

const password = {
  minLength: 8,
  maxBytes: 72,
};

const accessToken = {
  expiresIn: "15m",
};

const refreshToken = {
  ttlSeconds: 30 * 24 * 60 * 60, 
};

const rateLimit = {
  loginWindowSeconds: 15 * 60, 
  maxLoginAttempts: 5,
};

const messages = {
  invalidRequest: "Invalid request data",
  invalidOtp: "Invalid or expired OTP",
  otpSent: "Verification code sent",
  otpVerified: "Phone number verified successfully",
  otpRateLimited: "Too many attempts. Please try again later.",
  smsSendFailed: "Unable to send verification code. Please try again.",
};

export {
  otp,
  password,
  accessToken,
  refreshToken,
  rateLimit,
  messages,
};