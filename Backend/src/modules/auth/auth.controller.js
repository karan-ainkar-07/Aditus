import * as authService from "./auth.service.js";
import { cookies } from "./auth.config.js";

const { maxAge: _a, ...clearAccess } = cookies.access;
const { maxAge: _r, ...clearRefresh } = cookies.refresh;

const meta = (req) => ({
  userAgent: req.get("user-agent")?.slice(0, 255),
  ip: req.ip,
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(cookies.accessName, accessToken, cookies.access);
  res.cookie(cookies.refreshName, refreshToken, cookies.refresh);
};

const clearAuthCookies = (res) => {
  res.clearCookie(cookies.accessName, clearAccess);
  res.clearCookie(cookies.refreshName, clearRefresh);
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } =
      await authService.login(req.body, meta(req));
    setAuthCookies(res, { accessToken, refreshToken });
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(
      req.cookies?.[cookies.refreshName],
      meta(req)
    );
    setAuthCookies(res, tokens);
    return res.status(200).json({ message: "Session refreshed" });
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.cookies?.[cookies.refreshName]);
    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const result = await authService.me(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};