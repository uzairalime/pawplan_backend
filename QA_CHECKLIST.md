# PawPlan Phase 1 QA Checklist

## Auth and user onboarding

- Request OTP returns `1122` in development and `expiresInSeconds: 60`.
- Resend OTP resets the 60-second window.
- Verify OTP creates a new user on first login.
- Blocked, frozen, or deleted users cannot complete OTP login.
- `GET /api/auth/me` fails for blocked, frozen, or deleted users.

## User profile and moderation

- User profile can be updated in parts.
- Profile image upload returns `url` and `key`.
- Super admin can list, edit, freeze, block, unblock, and soft-delete users.
- Frozen or blocked users cannot use protected user APIs.

## Trainers and courses

- Super admin can create trainers and update trainer profile and credentials.
- Freezing a trainer hides their courses from public course APIs.
- Trainer can create a draft course with multiple lectures, steps, and daily tasks.
- Trainer can resubmit a rejected course after edits.
- Super admin can approve, reject, freeze, unfreeze, offline, and review trainer courses.
- Rejection reason is visible to the trainer.

## Course progress

- User can join a free course.
- Step completion updates enrollment progress.
- Daily task day is calculated from the join date.
- Streak increases on consecutive days and resets after a missed day.
- Course progress, completion count, and analytics update correctly.

## Reports and audit logs

- User can report a course.
- Super admin can resolve or dismiss course reports.
- Audit logs are created for user, trainer, course, quote, and moderation actions.
- Audit log page filters by search, action, and target type.

## Catalog and quotes

- Super admin can create and soft-delete breeds.
- Super admin can create and soft-delete training goals.
- Super admin can create, delete, and refresh quotes.
- Daily quote falls back correctly if no admin quote is active.

## Pagination and docs

- Paginated admin screens support next/previous page navigation.
- Search and filter state resets back to page 1.
- Swagger documents paginated endpoints with `meta`.
- Postman collection imports without manual cleanup.
