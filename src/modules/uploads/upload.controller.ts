import type { RequestHandler } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as uploadService from "./upload.service.js";

export const uploadProfileImage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Profile image is required");
    }

    const hostUrl = `${req.protocol}://${req.get("host")}`;
    const result = await uploadService.uploadProfileImage(req.file, hostUrl);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const uploadCourseVideo: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Course video is required");
    }

    const hostUrl = `${req.protocol}://${req.get("host")}`;
    const result = await uploadService.uploadCourseVideo(req.file, hostUrl);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const uploadCourseThumbnail: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Course thumbnail is required");
    }

    const hostUrl = `${req.protocol}://${req.get("host")}`;
    const result = await uploadService.uploadCourseThumbnail(req.file, hostUrl);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
