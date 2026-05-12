import multer from "multer";
import { UPLOAD_LIMITS, formatUploadLimit } from "../../constants/uploads.js";
import { ApiError } from "../../utils/api-error.js";

export const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_LIMITS.profileImage.maxBytes
  },
  fileFilter: (_req, file, callback) => {
    if (!UPLOAD_LIMITS.profileImage.allowedMimeTypes.includes(file.mimetype as (typeof UPLOAD_LIMITS.profileImage.allowedMimeTypes)[number])) {
      return callback(
        new ApiError(400, "Only JPG, PNG, or WEBP image files are allowed", {
          allowedMimeTypes: UPLOAD_LIMITS.profileImage.allowedMimeTypes
        })
      );
    }

    callback(null, true);
  }
});

export const courseVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_LIMITS.courseVideo.maxBytes
  },
  fileFilter: (_req, file, callback) => {
    if (!UPLOAD_LIMITS.courseVideo.allowedMimeTypes.includes(file.mimetype as (typeof UPLOAD_LIMITS.courseVideo.allowedMimeTypes)[number])) {
      return callback(
        new ApiError(400, "Only MP4, MOV, or WEBM video files are allowed", {
          allowedMimeTypes: UPLOAD_LIMITS.courseVideo.allowedMimeTypes
        })
      );
    }

    callback(null, true);
  }
});

export const uploadLimitMessages = {
  image: `Image file is too large. Maximum size is ${formatUploadLimit(UPLOAD_LIMITS.profileImage.maxBytes)}.`,
  video: `Video file is too large. Maximum size is ${formatUploadLimit(UPLOAD_LIMITS.courseVideo.maxBytes)}.`
};
