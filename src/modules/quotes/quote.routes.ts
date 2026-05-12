import { Router } from "express";
import { requireAdmin, requireSuperAdmin } from "../../middleware/admin.js";
import { validate } from "../../middleware/validate.js";
import * as quoteController from "./quote.controller.js";
import { createQuoteSchema, quoteIdParamsSchema } from "./quote.schemas.js";

export const quoteRouter = Router();
export const adminQuoteRouter = Router();

quoteRouter.get("/daily-quote", quoteController.getCurrentQuote);

adminQuoteRouter.use(requireAdmin);
adminQuoteRouter.get("/quotes", requireSuperAdmin, quoteController.listAdminQuotes);
adminQuoteRouter.post("/quotes", requireSuperAdmin, validate(createQuoteSchema), quoteController.createQuote);
adminQuoteRouter.post("/quotes/refresh", requireSuperAdmin, quoteController.refreshQuote);
adminQuoteRouter.delete(
  "/quotes/:quoteId",
  requireSuperAdmin,
  validate(quoteIdParamsSchema),
  quoteController.deleteQuote
);
