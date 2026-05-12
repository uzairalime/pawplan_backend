import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-error.js";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const requireAdmin: RequestHandler = async (req, _res, next) => {
  const apiKey = req.header("x-admin-key");

  if (apiKey === env.ADMIN_API_KEY) {
    req.admin = {
      id: "api-key",
      email: env.ADMIN_EMAIL,
      role: "SUPER_ADMIN"
    };
    return next();
  }

  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing admin credentials"));
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string; role?: string };

    if (!payload.sub || !payload.role) {
      throw new ApiError(401, "Invalid admin token");
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, isFrozen: true }
    });

    if (!admin || !admin.isActive || admin.isFrozen || admin.role !== payload.role) {
      throw new ApiError(401, "Invalid admin token");
    }

    req.admin = { id: admin.id, email: admin.email, role: admin.role };
    return next();
  } catch (error) {
    return next(error instanceof ApiError ? error : new ApiError(401, "Invalid admin token"));
  }
};

export const requireSuperAdmin: RequestHandler = (req, _res, next) => {
  if (req.admin?.role !== "SUPER_ADMIN") {
    return next(new ApiError(403, "Super admin access required"));
  }

  return next();
};
