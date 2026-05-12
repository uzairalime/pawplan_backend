import { z } from "zod";

export const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase()
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    otp: z.string().length(4)
  })
});
