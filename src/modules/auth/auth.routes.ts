import { Router } from "express";
import { createRateLimit } from "../../middleware/rate-limit.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { me, requestOtp, resendOtp, verifyOtp } from "./auth.controller.js";
import { requestOtpSchema, verifyOtpSchema } from "./auth.schemas.js";

export const authRouter = Router();

const otpRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: "otp",
  message: "Too many OTP requests. Please try again in a few minutes.",
  keyFn: (req) => req.body?.email?.toString().toLowerCase() ?? null
});

const verifyOtpRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyPrefix: "otp-verify",
  message: "Too many OTP verification attempts. Please try again in a few minutes.",
  keyFn: (req) => req.body?.email?.toString().toLowerCase() ?? null
});

authRouter.post("/request-otp", otpRateLimit, validate(requestOtpSchema), requestOtp);
authRouter.post("/resend-otp", otpRateLimit, validate(requestOtpSchema), resendOtp);
authRouter.post("/verify-otp", verifyOtpRateLimit, validate(verifyOtpSchema), verifyOtp);
authRouter.get("/me", requireAuth, me);
