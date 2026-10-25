import { Router } from "express";
import * as controller from "./auth.controller.js";

const router = Router();

router.post("/otp/send", controller.sendOtp);
router.post("/otp/verify", controller.verifyOtp);

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

router.post("/password/reset", controller.resetPassword);
router.post("/password/change", controller.authenticate, controller.changePassword);

router.get("/me", controller.authenticate, controller.me);

export default router;
