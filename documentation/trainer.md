# Trainer Documentation

## Purpose

This document explains the trainer role in PawPlan.

It covers:

- trainer permissions
- trainer APIs
- trainer portal screens
- buttons and why they exist
- course creation and review workflow

---

## Role

Trainer is stored as:

- `ADMIN`

Trainer is **not** super admin.

Trainer can:

- login to admin portal
- create course drafts
- edit only their own courses
- add lectures
- add steps
- add daily tasks
- submit course for review
- view course analytics for own course
- view rejection reason

Trainer cannot:

- manage users
- manage other trainers
- approve courses
- reject courses as moderator
- manage reports
- manage quotes
- manage catalog
- access audit logs

Backend enforcement:

- [src/middleware/admin.ts](/Users/apple/Documents/New%20project/src/middleware/admin.ts)

---

## Authentication

### API

#### `POST /api/admin/login`

### What it does

Authenticates trainer and returns:

- trainer profile
- role
- JWT token

### Why we use it

Trainer uses the same login endpoint as super admin, but receives trainer-limited access by role.

### Portal usage

- [admin-portal/src/app/login/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/login/page.tsx)

Button:

- `Login`

---

## Trainer Navigation

Trainer sees a smaller navigation set:

- Dashboard
- Courses

The portal hides super-admin-only sections.

Code reference:

- [admin-portal/src/components/AdminShell.tsx](/Users/apple/Documents/New%20project/admin-portal/src/components/AdminShell.tsx)

### Why this exists

Trainer should focus on content creation and performance, not platform operations.

---

## Trainer Dashboard

### APIs used

#### `GET /api/admin/courses`

### What it shows

- my courses
- pending review count
- rejected count
- draft/offline count

### Why this screen exists

Trainer needs a quick view of:

- how many courses they have
- which ones need action
- whether a course is blocked by moderation or incomplete

### Portal usage

- [admin-portal/src/app/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/page.tsx)

---

## Course List

### API

#### `GET /api/admin/courses`

### What it does for trainer

Returns only trainer-owned courses.

### Why we use it

This is the trainer’s main content workspace.

### Portal usage

- [admin-portal/src/app/courses/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/courses/page.tsx)

### Functions on this page

- create draft course
- search courses
- filter by level
- filter by status
- submit for review
- open detail page
- delete own course

### Why these functions exist

- trainers often work on multiple drafts at once
- filters reduce confusion as course count grows
- submit-for-review is the handoff into moderation

---

## Create Draft Course

### API

#### `POST /api/admin/courses`

### What it does

Creates a new draft course with:

- title
- description
- category
- level
- estimated days / minutes
- premium-ready pricing fields
- thumbnail
- lectures
- steps
- daily tasks

### Why we use it

Trainer should be able to build most of the course in one workflow.

### Portal usage

Screen:

- courses page

Button:

- `Create draft`

### Why this button exists

Draft mode lets trainer save incomplete work before review.

---

## Add Lecture

### API

#### `POST /api/admin/courses/:courseId/lectures`

### What it does

Adds a new lecture under a course.

Lecture may include:

- title
- description
- video
- steps
- daily tasks in create flow

### Why we use it

Courses need modular lesson structure.

### Portal usage

- course create flow
- course detail page

Button:

- `Add lecture`

### Why this button exists

Trainer needs to expand course content incrementally.

---

## Update Course

### API

#### `PATCH /api/admin/courses/:courseId`

### What it does

Updates course metadata and settings.

### Why we use it

Trainer may refine:

- course title
- description
- category
- level
- duration
- premium-ready fields
- thumbnail

### Portal usage

- [admin-portal/src/app/courses/[courseId]/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/courses/%5BcourseId%5D/page.tsx)

Button:

- `Save course`

---

## Update Lecture

### API

#### `PATCH /api/admin/lectures/:lectureId`

### What it does

Updates lecture details.

### Why we use it

Trainer needs to revise:

- title
- description
- video link
- order

### Portal usage

Button:

- `Save lecture`

---

## Delete Lecture

### API

#### `DELETE /api/admin/lectures/:lectureId`

### Why

Trainer may remove weak or outdated lecture content.

### Portal usage

Button:

- delete icon / delete lecture action

---

## Add Step

### API

#### `POST /api/admin/lectures/:lectureId/steps`

### What it does

Adds a training step to a lecture.

### Why we use it

Training needs step-by-step instruction, not just video.

### Portal usage

Button:

- `Add step`

---

## Update Step

### API

#### `PATCH /api/admin/steps/:stepId`

### Why

Trainer may improve learning instructions over time.

### Portal usage

Button:

- `Save step`

---

## Delete Step

### API

#### `DELETE /api/admin/steps/:stepId`

### Why

Remove incorrect or redundant training instruction.

### Portal usage

Button:

- delete step action

---

## Add Daily Task

### API

#### `POST /api/admin/courses/:courseId/daily-tasks`

### What it does

Creates a daily task tied to course day number.

### Why we use it

Daily tasks are the habit layer of the course journey.

### Portal usage

Button:

- `Add daily task`

---

## Update Daily Task

### API

#### `PATCH /api/admin/daily-tasks/:taskId`

### Why

Trainers need to improve daily task clarity and sequence.

### Portal usage

Button:

- `Save task`

---

## Delete Daily Task

### API

#### `DELETE /api/admin/daily-tasks/:taskId`

### Why

Allows removal of duplicate or incorrect task items.

### Portal usage

Button:

- delete task action

---

## Upload Thumbnail

### API

#### `POST /api/uploads/course-thumbnail`

### What it does

Uploads course thumbnail and returns:

- `url`
- `key`

### Why we use it

Course card and detail view need a visual asset.

### Portal usage

Button / field:

- thumbnail file input

---

## Upload Video

### API

#### `POST /api/uploads/course-video`

### What it does

Uploads lecture video and returns:

- `url`
- `key`

### Why we use it

Video is core course content.

### Portal usage

- lecture video input

---

## Submit Course For Review

### API

#### `PATCH /api/admin/courses/:courseId/submit-review`

### What it does

Changes course state to:

- `PENDING_REVIEW`

### Why we use it

This is the official handoff from trainer to super admin.

### Portal usage

Buttons:

- `Submit review`

### Why this button exists

Trainer needs a clear action that says:

- draft is ready
- moderation should review now

---

## View Course Detail

### API

#### `GET /api/admin/courses/:courseId`

### What it does

Loads full editable course detail.

### Why we use it

List page is not enough for detailed editing.

### Portal usage

- course detail screen

---

## View Course Analytics

### API

#### `GET /api/admin/courses/:courseId/analytics`

### What it does

Returns:

- enrollments
- average progress
- completion rate
- active streak users
- longest streak
- step count
- task count
- report count
- open report count
- views

### Why we use it

Trainer needs feedback on how content is performing.

### Portal usage

- course detail analytics section

### Why this matters

It helps trainer improve course quality and engagement.

---

## Course Status Meanings

### `DRAFT`

Trainer is still preparing content.

### `PENDING_REVIEW`

Trainer submitted course to super admin.

### `APPROVED`

Course passed review.

### `REJECTED`

Course needs changes before it can be approved.

### `OFFLINE`

Not currently visible to users.

### `FROZEN`

Moderation or safety restriction is active.

---

## Rejection Reason

### Where it comes from

#### `PATCH /api/admin/courses/:courseId/reject`

### Why trainer sees it

Trainer needs actionable feedback for resubmission.

### Portal usage

- course list
- course detail

### Why this matters

Without explicit reason, trainer cannot efficiently fix content.

---

## Buttons Summary

### `Create draft`

Reason:

- save new course in progress

### `Add lecture`

Reason:

- expand lesson structure

### `Add step`

Reason:

- build step-by-step training guidance

### `Add daily task`

Reason:

- shape repeated habit practice

### `Save course`

Reason:

- update high-level course info

### `Save lecture`

Reason:

- improve lesson-level content

### `Save step`

Reason:

- refine instruction quality

### `Save task`

Reason:

- improve daily practice flow

### `Submit review`

Reason:

- send content into moderation workflow

### `Delete lecture / step / task`

Reason:

- remove weak or incorrect content

### `Refresh`

Reason:

- sync latest backend state after edits or moderation

---

## Security Notes

- trainer can only manage own courses
- trainer cannot reassign ownership to another trainer
- trainer cannot approve their own course
- trainer cannot access user moderation, reports moderation, quotes, catalog, or audit logs

---

## Recommended Future Documentation

- `trainer_course_quality_guidelines.md`
- `trainer_video_upload_guide.md`
- `trainer_rejection_examples.md`

