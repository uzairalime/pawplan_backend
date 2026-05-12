import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getProfile, updateProfile } from "./profile.controller.js";
import { updateProfileSchema } from "./profile.schemas.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);
profileRouter.get("/", getProfile);
profileRouter.patch("/", validate(updateProfileSchema), updateProfile);
