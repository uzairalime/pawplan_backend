import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { uploadLimitMessages } from "../modules/uploads/upload.middleware.js";
import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      statusCode: 400,
      message: "Validation failed",
      issues: error.flatten()
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      message: error.message,
      details: error.details
    });
  }

  if (error?.name === "MulterError") {
    const isVideoRoute = req.path.includes("course-video");
    return res.status(400).json({
      statusCode: 400,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? isVideoRoute
            ? uploadLimitMessages.video
            : uploadLimitMessages.image
          : "Invalid upload"
    });
  }

  console.error(error);

  return res.status(500).json({
    statusCode: 500,
    message: "Something went wrong"
  });
};
