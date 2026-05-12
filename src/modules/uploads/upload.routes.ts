import { Router } from "express";
import { requireAdmin } from "../../middleware/admin.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  uploadCourseThumbnail,
  uploadCourseVideo,
  uploadProfileImage
} from "./upload.controller.js";
import { courseVideoUpload, profileImageUpload } from "./upload.middleware.js";

export const uploadRouter = Router();

uploadRouter.post(
  "/profile-image",
  requireAuth,
  profileImageUpload.single("image"),
  uploadProfileImage
);

uploadRouter.post(
  "/course-video",
  requireAdmin,
  courseVideoUpload.single("video"),
  uploadCourseVideo
);

uploadRouter.post(
  "/course-thumbnail",
  requireAdmin,
  profileImageUpload.single("image"),
  uploadCourseThumbnail
);
