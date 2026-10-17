import * as authService from "./auth.service.js";

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