import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";

const STATIC_OTP = "1122";
const OTP_VALIDITY_MS = 60 * 1000;

const signToken = (userId: string) =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });

const userInclude = {
  breed: true,
  trainingGoals: {
    include: {
      trainingGoal: true
    }
  }
};

export async function requestOtp(input: { email: string }) {
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS);

  await prisma.emailOtp.upsert({
    where: { email: input.email },
    update: { code: STATIC_OTP, expiresAt },
    create: { email: input.email, code: STATIC_OTP, expiresAt }
  });

  return {
    message: "OTP sent successfully",
    email: input.email,
    expiresInSeconds: 60,
    otp: env.NODE_ENV === "production" ? undefined : STATIC_OTP
  };
}

export async function resendOtp(input: { email: string }) {
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS);

  await prisma.emailOtp.upsert({
    where: { email: input.email },
    update: { code: STATIC_OTP, expiresAt },
    create: { email: input.email, code: STATIC_OTP, expiresAt }
  });

  return {
    message: "OTP resent successfully",
    email: input.email,
    expiresInSeconds: 60,
    otp: env.NODE_ENV === "production" ? undefined : STATIC_OTP
  };
}

export async function verifyOtp(input: { email: string; otp: string }) {
  const otpRecord = await prisma.emailOtp.findUnique({
    where: { email: input.email }
  });

  if (!otpRecord) {
    throw new ApiError(400, "OTP not requested");
  }

  if (otpRecord.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.delete({ where: { email: input.email } });
    throw new ApiError(400, "OTP expired");
  }

  if (input.otp !== otpRecord.code) {
    throw new ApiError(400, "Invalid OTP");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    include: userInclude
  });

  if (existingUser?.deletedAt) {
    throw new ApiError(403, "User account is deleted");
  }

  if (existingUser?.isBlocked) {
    throw new ApiError(403, "User account is blocked");
  }

  if (existingUser?.isFrozen) {
    throw new ApiError(403, "User account is frozen");
  }

  const user =
    existingUser ??
    (await prisma.user.create({
      data: { email: input.email },
      include: userInclude
    }));

  await prisma.emailOtp.delete({ where: { email: input.email } });

  return {
    user,
    token: signToken(user.id),
    isNewUser: !existingUser
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude
  });

  if (!user || user.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  return user;
}
