import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { env } from "../src/config/env.js";
import { prisma } from "../src/db/prisma.js";
import { requireAuth } from "../src/middleware/auth.js";
import { requestOtp, verifyOtp } from "../src/modules/auth/auth.service.js";
import { ApiError } from "../src/utils/api-error.js";
import { createUser, resetDatabase } from "./helpers/db.js";

test.beforeEach(async () => {
  await resetDatabase();
});

test.after(async () => {
  await prisma.$disconnect();
});

test("verifyOtp rejects blocked, frozen, and deleted users", async () => {
  const blocked = await createUser("blocked@pawplan.com");
  await prisma.user.update({
    where: { id: blocked.id },
    data: { isBlocked: true, blockReason: "Manual moderation" }
  });
  await requestOtp({ email: blocked.email });
  await assert.rejects(() => verifyOtp({ email: blocked.email, otp: "1122" }), (error: unknown) => {
    assert(error instanceof ApiError);
    assert.equal(error.message, "User account is blocked");
    return true;
  });

  const frozen = await createUser("frozen@pawplan.com");
  await prisma.user.update({
    where: { id: frozen.id },
    data: { isFrozen: true, freezeReason: "Manual moderation" }
  });
  await requestOtp({ email: frozen.email });
  await assert.rejects(() => verifyOtp({ email: frozen.email, otp: "1122" }), (error: unknown) => {
    assert(error instanceof ApiError);
    assert.equal(error.message, "User account is frozen");
    return true;
  });

  const deleted = await createUser("deleted@pawplan.com");
  await prisma.user.update({
    where: { id: deleted.id },
    data: { deletedAt: new Date() }
  });
  await requestOtp({ email: deleted.email });
  await assert.rejects(() => verifyOtp({ email: deleted.email, otp: "1122" }), (error: unknown) => {
    assert(error instanceof ApiError);
    assert.equal(error.message, "User account is deleted");
    return true;
  });
});

test("requireAuth rejects blocked users with an existing token", async () => {
  const user = await createUser("middleware@pawplan.com");
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { isBlocked: true, blockReason: "Moderated" }
  });

  const req = {
    headers: {
      authorization: `Bearer ${token}`
    }
  } as any;

  const error = await new Promise<unknown>((resolve) => {
    requireAuth(req, {} as any, (nextError?: unknown) => resolve(nextError));
  });

  assert(error instanceof ApiError);
  assert.equal(error.message, "Invalid token");
});
