# PawPlan Architecture

## API surface

- Current stable compatibility path: `/api/...`
- Versioned path for forward work: `/api/v1/...`
- Both paths point to the same router today so existing clients keep working while phase 2 can move against `/api/v1`.

## Auth flow

1. User requests OTP with email.
2. Development OTP is static: `1122`.
3. Verify OTP creates the user on first login.
4. A JWT is returned for protected user APIs.
5. Blocked, frozen, or deleted users are denied at OTP verification and protected route middleware.

## Roles and permissions

### Super admin

- Creates and manages trainers
- Reviews, approves, rejects, freezes, and offlines courses
- Moderates users
- Reviews course reports
- Manages quotes and catalog
- Views audit logs and operational stats

### Trainer

- Creates and edits only their own courses
- Adds lectures, steps, and daily tasks
- Submits courses for super-admin review
- Sees approval status and rejection reason

## Course lifecycle

1. Trainer creates course as `DRAFT`
2. Trainer adds thumbnail, lectures, steps, and daily tasks
3. Trainer submits for review
4. Super admin approves or rejects
5. Approved course can be online for users
6. Course can also be frozen or taken offline later

## Progress and streaks

- Users join free courses through enrollment
- Step completion updates progress percentage
- Daily task day is calculated from the user join date
- Consecutive completions increase streak
- Missing a day resets the next completion streak to `1`

## Moderation model

- Users can be frozen, blocked, or soft deleted
- Trainers can be deactivated/frozen
- Trainer freeze hides trainer courses from public course APIs
- Courses can be frozen independently
- User reports create course-report records for super-admin review
- Admin actions are recorded in audit logs

## Storage

- Uploads support local storage now
- S3 support is already shaped in configuration for later production use

## Future payment insertion point

Phase 2 should add purchase and access control around courses without replacing enrollment itself.

Recommended insertion:

- `CoursePurchase`
- payment provider transaction id
- payment status
- refund status
- access status / entitlement window

That keeps:

- course content ownership
- progress
- streaks
- reports

separate from payment bookkeeping.
