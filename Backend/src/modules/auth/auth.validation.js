import { z } from "zod";

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Use E.164 format, e.g. +919876543210");

export const registerSchema = z.object({
  phone: phoneSchema,
  password: z
    .string()
    .min(8)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "Password is too long"
    ),
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{4,10}$/, "Invalid OTP format"),
});

export const resendOtpSchema = z.object({
  phone: phoneSchema,
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(72),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid request data",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  req.body = result.data;
  next();
};