export const UPLOAD_LIMITS = {
  profileImage: {
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
  },
  courseThumbnail: {
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
  },
  courseVideo: {
    maxBytes: 200 * 1024 * 1024,
    allowedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"]
  }
} as const;

export function formatUploadLimit(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }

  return `${Math.round(bytes / 1024)}KB`;
}
