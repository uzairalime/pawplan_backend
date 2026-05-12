# User App Documentation

## Purpose

This document explains the user-side app APIs and app functionality.

It covers:

- authentication
- profile
- course discovery
- course join flow
- progress tracking
- streak logic
- reporting

---

## User Journey Overview

User app flow:

1. request OTP
2. verify OTP
3. if new user, profile is incomplete
4. complete profile in parts
5. browse courses
6. join course
7. complete steps
8. complete daily tasks
9. build streak
10. report course if needed

---

## Authentication

## 1. Request OTP

### API

#### `POST /api/auth/request-otp`

### What it does

Sends development OTP `1122`.

Validity:

- 1 minute

### Why we use it

Simple email-first login flow without password creation.

### App functionality reason

This reduces onboarding friction.

---

## 2. Resend OTP

### API

#### `POST /api/auth/resend-otp`

### What it does

Resends the OTP and resets expiry.

### Why we use it

Users often miss or delay entering OTP.

### App functionality reason

Improves login completion rate.

---

## 3. Verify OTP

### API

#### `POST /api/auth/verify-otp`

### What it does

- validates OTP
- creates user if first login
- returns JWT
- returns user data

### Important logic

For first-time user:

- `isProfileCompleted = false`

### Why we use it

The frontend can immediately route new user into onboarding/profile completion.

---

## 4. Current user

### API

#### `GET /api/auth/me`

### What it does

Returns current authenticated user.

### Why we use it

App needs persistent user identity after app restart or token reuse.

---

## Profile

## 1. Get profile

### API

#### `GET /api/profile`

### Why we use it

Load user onboarding/profile state.

---

## 2. Update profile

### API

#### `PATCH /api/profile`

### What it does

Allows partial profile updates.

Fields include:

- profile picture
- dog name
- dog age
- gender
- breed
- training goals
- profile completed

### Why we use it

User can save profile in parts instead of one long forced form.

### Functionality reason

This improves completion and reduces onboarding abandonment.

---

## 3. Upload profile image

### API

#### `POST /api/uploads/profile-image`

### What it does

Uploads profile image and returns:

- `url`
- `key`

### Why we use it

Frontend stores upload result and then saves the URL/key into profile.

---

## Catalog

## 1. List breeds

### API

#### `GET /api/breeds`

### Why we use it

Needed for onboarding and profile edit screens.

---

## 2. List training goals

### API

#### `GET /api/training-goals`

### Why we use it

Needed for multi-select training-interest onboarding.

---

## Courses

## 1. List courses

### API

#### `GET /api/courses`

### What it does

Returns public user-visible courses only.

User cannot see:

- deleted courses
- frozen courses
- unpublished courses
- courses from frozen trainers

### Why we use it

Course feed must only show approved and visible content.

### App functionality reason

Protects users from incomplete or moderated content.

---

## 2. Get course detail

### API

#### `GET /api/courses/:courseId`

### What it does

Returns course detail including:

- trainer info
- lectures
- steps
- daily tasks

### Why we use it

Course detail screen needs learning structure before user joins or resumes.

---

## 3. Join course

### API

#### `POST /api/courses/:courseId/join`

### What it does

Creates or reuses enrollment record.

Tracks:

- joinedAt
- progress
- streak fields
- completion state

### Why we use it

Joining course starts the user-specific progress timeline.

### Important business rule

Daily task day count is based on `joinedAt`.

---

## 4. List my joined courses

### API

#### `GET /api/courses/my-courses`

### Why we use it

User needs a personal learning library showing current enrollments.

---

## 5. Get course progress

### API

#### `GET /api/courses/:courseId/progress`

### What it does

Returns:

- enrollment progress
- completed steps
- today’s daily task

### Why we use it

User app needs to know what is done and what is next.

---

## 6. Resume course

### API

#### `GET /api/courses/:courseId/resume`

### What it does

Returns:

- next lecture
- next incomplete step
- today’s task

### Why we use it

Resume should be fast and reduce friction for repeat sessions.

---

## 7. Daily task history

### API

#### `GET /api/courses/:courseId/daily-task-history`

### Why we use it

Supports:

- streak history
- progress history
- user motivation features

---

## Steps and Progress

## 1. Complete step

### API

#### `POST /api/courses/steps/:stepId/complete`

### What it does

Marks a step complete and refreshes progress percent.

### Why we use it

Step-level completion is the core learning progress unit.

---

## 2. Complete daily task

### API

#### `POST /api/courses/daily-tasks/:taskId/complete`

### What it does

Completes a daily task for the expected day only.

Updates:

- `currentStreak`
- `longestStreak`
- `lastTaskCompletedDate`

### Important business rule

Task day must match:

- number of days since join date

### Why we use it

This keeps course habit system fair and sequential.

### Functionality reason

Daily tasks are not generic checkboxes. They are tied to the learner’s personal course day.

---

## Quotes

## 1. Daily quote

### API

#### `GET /api/daily-quote`

### What it does

Returns cached motivational quote.

Priority:

1. admin quote
2. public fallback API
3. built-in fallback quote

Refresh window:

- every 12 hours

### Why we use it

Adds lightweight motivation and personality to the app.

---

## Reports

## 1. Report course

### API

#### `POST /api/courses/:courseId/report`

### What it does

Lets user report course with:

- reason
- optional details

### Why we use it

User needs a moderation and safety feedback path.

### Functionality reason

Without reporting, harmful or inaccurate course content has no user escalation path.

---

## User Account Restriction Behavior

Blocked, frozen, or deleted users cannot continue normal authenticated flows.

Affected behavior:

- cannot successfully verify OTP into account
- cannot use protected user APIs

### Why this exists

This is required for moderation and account safety handling.

---

## Important UI Functionality Reasons

### OTP flow

Reason:

- low-friction auth

### Partial profile save

Reason:

- improves onboarding completion

### Join course

Reason:

- starts personal progress timeline

### Step completion

Reason:

- progress tracking

### Daily task completion

Reason:

- habit building and streak system

### Resume course

Reason:

- reduce friction for repeat learning sessions

### Report course

Reason:

- safety and quality feedback loop

---

## Suggested Future User Docs

- `user_notifications.md`
- `user_streak_rules.md`
- `user_reports.md`
- `phase_2_payments_user_access.md`

