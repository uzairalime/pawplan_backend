import { Router } from "express";
import { requireAdmin, requireSuperAdmin } from "../../middleware/admin.js";
import { validate } from "../../middleware/validate.js";
import * as catalogController from "./catalog.controller.js";
import { catalogIdParamsSchema, createCatalogItemSchema } from "./catalog.schemas.js";

export const catalogRouter = Router();
export const adminCatalogRouter = Router();

catalogRouter.get("/breeds", catalogController.listBreeds);
catalogRouter.get("/training-goals", catalogController.listTrainingGoals);

adminCatalogRouter.use(requireAdmin);
adminCatalogRouter.post(
  "/breeds",
  requireSuperAdmin,
  validate(createCatalogItemSchema),
  catalogController.createBreed
);
adminCatalogRouter.delete(
  "/breeds/:id",
  requireSuperAdmin,
  validate(catalogIdParamsSchema),
  catalogController.deleteBreed
);
adminCatalogRouter.post(
  "/training-goals",
  requireSuperAdmin,
  validate(createCatalogItemSchema),
  catalogController.createTrainingGoal
);
adminCatalogRouter.delete(
  "/training-goals/:id",
  requireSuperAdmin,
  validate(catalogIdParamsSchema),
  catalogController.deleteTrainingGoal
);
