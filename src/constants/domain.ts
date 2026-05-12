export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;
export const GENDERS = ["MALE", "FEMALE"] as const;
export const COURSE_APPROVAL_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED"
] as const;
export const COURSE_REPORT_REASONS = [
  "WRONG_INFO",
  "UNSAFE_TRAINING",
  "BAD_VIDEO",
  "SPAM",
  "OTHER"
] as const;
export const COURSE_REPORT_STATUSES = ["OPEN", "RESOLVED", "DISMISSED"] as const;
