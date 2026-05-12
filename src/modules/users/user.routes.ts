import { Router } from "express";
import { requireAdmin, requireSuperAdmin } from "../../middleware/admin.js";
import { validate } from "../../middleware/validate.js";
import {
  blockUser,
  deleteUser,
  freezeUser,
  getUserDetail,
  listUsers,
  unblockUser,
  unfreezeUser,
  updateUser
} from "./user.controller.js";
import { updateUserAdminSchema, userIdParamsSchema, userModerationSchema } from "./user.schemas.js";

export const adminUserRouter = Router();

adminUserRouter.use(requireAdmin, requireSuperAdmin);
adminUserRouter.get("/users", listUsers);
adminUserRouter.get("/users/:userId", validate(userIdParamsSchema), getUserDetail);
adminUserRouter.patch("/users/:userId", validate(updateUserAdminSchema), updateUser);
adminUserRouter.patch("/users/:userId/freeze", validate(userModerationSchema), freezeUser);
adminUserRouter.patch("/users/:userId/unfreeze", validate(userIdParamsSchema), unfreezeUser);
adminUserRouter.patch("/users/:userId/block", validate(userModerationSchema), blockUser);
adminUserRouter.patch("/users/:userId/unblock", validate(userIdParamsSchema), unblockUser);
adminUserRouter.delete("/users/:userId", validate(userIdParamsSchema), deleteUser);
