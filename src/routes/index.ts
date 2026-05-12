import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminCatalogRouter, catalogRouter } from "../modules/catalog/catalog.routes.js";
import { adminCourseRouter, courseRouter } from "../modules/courses/course.routes.js";
import { profileRouter } from "../modules/profile/profile.routes.js";
import { adminQuoteRouter, quoteRouter } from "../modules/quotes/quote.routes.js";
import { uploadRouter } from "../modules/uploads/upload.routes.js";
import { adminUserRouter } from "../modules/users/user.routes.js";

export const apiRouter = Router();
export const apiV1Router = Router();

function registerApiRoutes(router: Router) {
  router.use("/auth", authRouter);
  router.use("/", catalogRouter);
  router.use("/", quoteRouter);
  router.use("/courses", courseRouter);
  router.use("/profile", profileRouter);
  router.use("/uploads", uploadRouter);
  router.use("/admin", adminRouter);
  router.use("/admin", adminCatalogRouter);
  router.use("/admin", adminCourseRouter);
  router.use("/admin", adminQuoteRouter);
  router.use("/admin", adminUserRouter);
}

registerApiRoutes(apiRouter);
registerApiRoutes(apiV1Router);
