import * as service from "./auth.service.js";
import { AuthError } from "./auth.service.js";
import { AUTH_BASE_PATH, COOKIE, TOKEN } from "./auth.config.js";

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.retryAfter > 0) res.set("Retry-After", String(err.retryAfter));
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    next(err);
  }
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(COOKIE.ACCESS_NAME, accessToken, {
    ...COOKIE.BASE,
    path: "/",
    maxAge: TOKEN.ACCESS_TTL_SEC * 1000,
  });
  // refresh cookie only travels to /api/auth/*
  res.cookie(COOKIE.REFRESH_NAME, refreshToken, {
    ...COOKIE.BASE,
    path: AUTH_BASE_PATH,
    maxAge: TOKEN.REFRESH_TTL_MS,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie(COOKIE.ACCESS_NAME, { ...COOKIE.BASE, path: "/" });
  res.clearCookie(COOKIE.REFRESH_NAME, { ...COOKIE.BASE, path: AUTH_BASE_PATH });
};

// attaches req.auth = { userId, accountType, membership }
export const authenticate = handle(async (req, _res, next) => {
  req.auth = await service.authenticateToken(req.cookies?.[COOKIE.ACCESS_NAME]);
  next();
});

export const sendOtp = handle(async (req, res) => {
  const { phone, purpose } = req.body ?? {};
  res.json(await service.sendOtp({ phone, purpose, ip: req.ip }));
});

export const verifyOtp = handle(async (req, res) => {
  const { phone, purpose, otp } = req.body ?? {};
  res.json(await service.verifyOtp({ phone, purpose, otp }));
});

export const register = handle(async (req, res) => {
  const { phone, password, name, role } = req.body ?? {};
  const { user, ...tokens } = await service.register({ phone, password, name, role });
  setAuthCookies(res, tokens);
  res.status(201).json({ user });
});

export const login = handle(async (req, res) => {
  const { phone, password } = req.body ?? {};
  const { user, ...tokens } = await service.login({ phone, password });
  setAuthCookies(res, tokens);
  res.json({ user });
});

export const refresh = handle(async (req, res) => {
  try {
    setAuthCookies(res, await service.refresh(req.cookies?.[COOKIE.REFRESH_NAME]));
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }
  res.json({ ok: true });
});

export const logout = handle(async (req, res) => {
  await service.logout(req.cookies?.[COOKIE.REFRESH_NAME]);
  clearAuthCookies(res);
  res.json({ ok: true });
});

export const me = handle(async (req, res) => {
  res.json({ user: await service.getMe(req.auth.userId) });
});

export const changePassword = handle(async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const tokens = await service.changePassword({ userId: req.auth.userId, currentPassword, newPassword });
  setAuthCookies(res, tokens);
  res.json({ ok: true });
});

export const resetPassword = handle(async (req, res) => {
  const { phone, newPassword } = req.body ?? {};
  res.json(await service.resetPassword({ phone, newPassword }));
});
