import { Router } from "express";
import { createRateLimit } from "../../middleware/rate-limit.js";
import { requireAdmin, requireSuperAdmin } from "../../middleware/admin.js";
import { validate } from "../../middleware/validate.js";
import { getAuditLogs } from "../audit/audit.controller.js";
import {
  activateAdmin,
  createAdmin,
  deactivateAdmin,
  exportCourses,
  exportReports,
  exportTrainers,
  exportUsers,
  getDashboardStats,
  getTrainerDetail,
  listAdmins,
  login,
  updateAdminCredentials,
  updateAdminProfile
} from "./admin.controller.js";
import {
  adminIdParamsSchema,
  adminLoginSchema,
  createAdminSchema,
  updateAdminStatusSchema,
  updateAdminCredentialsSchema,
  updateAdminProfileSchema
} from "./admin.schemas.js";

export const adminRouter = Router();

const adminLoginRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyPrefix: "admin-login",
  message: "Too many admin login attempts. Please try again in a few minutes.",
  keyFn: (req) => req.body?.email?.toString().toLowerCase() ?? null
});

adminRouter.post("/login", adminLoginRateLimit, validate(adminLoginSchema), login);
adminRouter.get("/dashboard-stats", requireAdmin, requireSuperAdmin, getDashboardStats);
adminRouter.get("/audit-logs", requireAdmin, requireSuperAdmin, getAuditLogs);
adminRouter.get("/exports/users.csv", requireAdmin, requireSuperAdmin, exportUsers);
adminRouter.get("/exports/trainers.csv", requireAdmin, requireSuperAdmin, exportTrainers);
adminRouter.get("/exports/courses.csv", requireAdmin, requireSuperAdmin, exportCourses);
adminRouter.get("/exports/reports.csv", requireAdmin, requireSuperAdmin, exportReports);
adminRouter.get("/trainers", requireAdmin, requireSuperAdmin, listAdmins);
adminRouter.get(
  "/trainers/:adminId",
  requireAdmin,
  requireSuperAdmin,
  validate(adminIdParamsSchema),
  getTrainerDetail
);
adminRouter.post(
  "/trainers",
  requireAdmin,
  requireSuperAdmin,
  validate(createAdminSchema),
  createAdmin
);
adminRouter.patch(
  "/trainers/:adminId/activate",
  requireAdmin,
  requireSuperAdmin,
  validate(updateAdminStatusSchema),
  activateAdmin
);
adminRouter.patch(
  "/trainers/:adminId/deactivate",
  requireAdmin,
  requireSuperAdmin,
  validate(updateAdminStatusSchema),
  deactivateAdmin
);
adminRouter.patch(
  "/trainers/:adminId/profile",
  requireAdmin,
  requireSuperAdmin,
  validate(updateAdminProfileSchema),
  updateAdminProfile
);
adminRouter.patch(
  "/trainers/:adminId/credentials",
  requireAdmin,
  requireSuperAdmin,
  validate(updateAdminCredentialsSchema),
  updateAdminCredentials
);
