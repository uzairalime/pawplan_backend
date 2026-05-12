import type { RequestHandler } from "express";
import * as quoteService from "./quote.service.js";
import { buildMeta, parsePagination } from "../../utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";

export const getCurrentQuote: RequestHandler = async (_req, res, next) => {
  try {
    const quote = await quoteService.getCurrentQuote();
    res.json({ quote });
  } catch (error) {
    next(error);
  }
};

export const listAdminQuotes: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { quotes, total } = await quoteService.listAdminQuotePage({
      page,
      limit,
      search: typeof req.query.search === "string" ? req.query.search : undefined
    });
    res.json({ quotes, meta: buildMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
};

export const createQuote: RequestHandler = async (req, res, next) => {
  try {
    const quote = await quoteService.createQuote(req.body);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "QUOTE_CREATE",
      targetType: "QUOTE",
      targetId: quote.id
    });
    res.status(201).json({ quote });
  } catch (error) {
    next(error);
  }
};

export const deleteQuote: RequestHandler = async (req, res, next) => {
  try {
    await quoteService.deleteQuote(req.params.quoteId);
    await createAuditLog({
      actorType: "ADMIN",
      actorId: req.admin?.id,
      actorEmail: req.admin?.email,
      action: "QUOTE_DELETE",
      targetType: "QUOTE",
      targetId: req.params.quoteId
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refreshQuote: RequestHandler = async (_req, res, next) => {
  try {
    const quote = await quoteService.refreshQuote();
    await createAuditLog({
      actorType: "ADMIN",
      actorId: res.req.admin?.id,
      actorEmail: res.req.admin?.email,
      action: "QUOTE_REFRESH",
      targetType: "QUOTE_CACHE",
      targetId: quote.id
    });
    res.json({ quote });
  } catch (error) {
    next(error);
  }
};
