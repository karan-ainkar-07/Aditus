
import { Router } from "express";

import * as authController from "./auth.controller.js";
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  refreshSchema,
  validate,
} from "./auth.validation.js";

import authenticate from "../../middleware/authenticate.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyOtp
);

router.post(
  "/resend-otp",
  validate(resendOtpSchema),
  authController.resendOtp
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.post(
  "/refresh",
  validate(refreshSchema),
  authController.refresh
);

router.post(
  "/logout",
  validate(refreshSchema),
  authController.logout
);

router.get("/me", authenticate, authController.me);

export default router;
