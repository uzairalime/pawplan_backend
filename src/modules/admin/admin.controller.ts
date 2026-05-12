import type { RequestHandler } from "express";
import * as adminService from "./admin.service.js";
import {
  exportCoursesCsv,
  exportReportsCsv,
  exportTrainersCsv,
  exportUsersCsv
} from "./admin-export.service.js";
import { buildMeta, parsePagination } from "../../utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await adminService.loginAdmin(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const listAdmins: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { admins, total } = await adminService.listAdmins({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined
    });
    res.json({ admins, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const createAdmin: RequestHandler = async (req, res, next) => {
  try {
    const admin = await adminService.createAdmin(req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "TRAINER_CREATE",
      targetType: "TRAINER",
      targetId: admin.id,
      metadata: { email: admin.email }
    });
    res.status(201).json({ admin });
  } catch (error) {
    next(error);
  }
};

export const activateAdmin: RequestHandler = async (req, res, next) => {
  try {
    const admin = await adminService.updateAdminStatus(req.params.adminId, true);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "TRAINER_ACTIVATE",
      targetType: "TRAINER",
      targetId: admin.id
    });
    res.json({ admin });
  } catch (error) {
    next(error);
  }
};

export const deactivateAdmin: RequestHandler = async (req, res, next) => {
  try {
    const admin = await adminService.updateAdminStatus(req.params.adminId, false, req.body.reason);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "TRAINER_FREEZE",
      targetType: "TRAINER",
      targetId: admin.id,
      metadata: { reason: req.body.reason }
    });
    res.json({ admin });
  } catch (error) {
    next(error);
  }
};

export const updateAdminProfile: RequestHandler = async (req, res, next) => {
  try {
    const admin = await adminService.updateAdminProfile(req.params.adminId, req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "TRAINER_PROFILE_UPDATE",
      targetType: "TRAINER",
      targetId: admin.id
    });
    res.json({ admin });
  } catch (error) {
    next(error);
  }
};

export const updateAdminCredentials: RequestHandler = async (req, res, next) => {
  try {
    const admin = await adminService.updateAdminCredentials(req.params.adminId, req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "TRAINER_CREDENTIAL_UPDATE",
      targetType: "TRAINER",
      targetId: admin.id
    });
    res.json({ admin });
  } catch (error) {
    next(error);
  }
};

export const getTrainerDetail: RequestHandler = async (req, res, next) => {
  try {
    const result = await adminService.getTrainerDetail(req.params.adminId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats: RequestHandler = async (_req, res, next) => {
  try {
    const stats = await adminService.getAdminDashboardStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

function sendCsv(res: Parameters<RequestHandler>[1], filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

export const exportUsers: RequestHandler = async (_req, res, next) => {
  try {
    sendCsv(res, "pawplan-users.csv", await exportUsersCsv());
  } catch (error) {
    next(error);
  }
};

export const exportTrainers: RequestHandler = async (_req, res, next) => {
  try {
    sendCsv(res, "pawplan-trainers.csv", await exportTrainersCsv());
  } catch (error) {
    next(error);
  }
};

export const exportCourses: RequestHandler = async (_req, res, next) => {
  try {
    sendCsv(res, "pawplan-courses.csv", await exportCoursesCsv());
  } catch (error) {
    next(error);
  }
};

export const exportReports: RequestHandler = async (_req, res, next) => {
  try {
    sendCsv(res, "pawplan-reports.csv", await exportReportsCsv());
  } catch (error) {
    next(error);
  }
};
