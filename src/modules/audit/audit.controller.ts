import type { RequestHandler } from "express";
import { listAuditLogs } from "./audit.service.js";
import { buildMeta, parsePagination } from "../../utils/pagination.js";

export const getAuditLogs: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { logs, total } = await listAuditLogs({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      targetType: typeof req.query.targetType === "string" ? req.query.targetType : undefined
    });
    res.json({ logs, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};
