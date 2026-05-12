# Course Lifecycle Documentation

## Purpose

This document explains how a course moves through PawPlan from creation to user learning and moderation.

It covers:

- trainer creation flow
- review flow
- visibility flow
- moderation flow
- user progress flow

---

## Lifecycle Overview

A course can move through these states:

1. draft creation
2. content building
3. submit for review
4. approve or reject
5. online / offline visibility
6. freeze / unfreeze moderation state
7. user join and progress
8. report and moderation review

---

## Stage 1: Draft Creation

### API

#### `POST /api/admin/courses`

### Who uses it

- trainer
- super admin if needed

### Result

Course starts as:

- `approvalStatus = DRAFT`
- `isPublished = false`

### Why this stage exists

Course content is often incomplete at the beginning.

Draft mode lets content exist before it is ready for user visibility.

---

## Stage 2: Content Building

Trainer adds structure:

- lectures
- steps
- daily tasks
- thumbnail
- video

### APIs involved

#### `POST /api/admin/courses/:courseId/lectures`

#### `POST /api/admin/lectures/:lectureId/steps`

#### `POST /api/admin/courses/:courseId/daily-tasks`

#### `POST /api/uploads/course-thumbnail`

#### `POST /api/uploads/course-video`

### Why this stage exists

Course should be content-complete before moderation.

---

## Stage 3: Submit For Review

### API

#### `PATCH /api/admin/courses/:courseId/submit-review`

### Result

Course becomes:

- `approvalStatus = PENDING_REVIEW`
- `isPublished = false`

### Why this stage exists

Trainer needs a clean handoff into super-admin moderation.

### Validation before submission

Course must have:

- thumbnail
- at least one lecture
- at least one step
- at least one daily task

### Why this validation exists

Prevents empty or incomplete courses from entering moderation.

---

## Stage 4: Approval

### API

#### `PATCH /api/admin/courses/:courseId/approve`

### Who uses it

- super admin only

### Result

- `approvalStatus = APPROVED`
- `isPublished = true`

### Why this stage exists

Only reviewed content should become user-visible.

---

## Stage 5: Rejection

### API

#### `PATCH /api/admin/courses/:courseId/reject`

### Who uses it

- super admin only

### Result

- `approvalStatus = REJECTED`
- `isPublished = false`
- `rejectionReason` stored

### Why this stage exists

Rejection prevents low-quality or unsafe content from reaching users while still allowing correction.

---

## Stage 6: Online / Offline Visibility

### APIs

#### `PATCH /api/admin/courses/:courseId/online`

#### `PATCH /api/admin/courses/:courseId/offline`

### Meaning

Approved course can still be:

- online
- offline

### Why this stage exists

Publication control is different from editorial approval.

Examples:

- approved but temporarily hidden
- approved but waiting for business launch

---

## Stage 7: Freeze / Unfreeze

### APIs

#### `PATCH /api/admin/courses/:courseId/freeze`

#### `PATCH /api/admin/courses/:courseId/unfreeze`

### Meaning

Freeze is a moderation state.

Frozen course:

- is not publicly available
- may carry freeze reason

### Why this stage exists

Moderation sometimes needs a stronger safety state than just offline.

---

## Stage 8: Trainer Freeze Effect

### API

#### `PATCH /api/admin/trainers/:adminId/deactivate`

### Effect on course lifecycle

Trainer freeze affects trainer-owned courses.

Public course listing hides courses from frozen trainers.

### Why this exists

Platform needs an account-level safety action.

---

## Stage 9: User Discovery

### API

#### `GET /api/courses`

### What user sees

Only courses that are:

- published
- not deleted
- not frozen
- not owned by frozen trainer

### Why this stage exists

Users should only see safe and approved content.

---

## Stage 10: User Join

### API

#### `POST /api/courses/:courseId/join`

### Result

Creates enrollment record with:

- joinedAt
- progress fields
- streak fields

### Why this stage exists

Join moment is the start of the learner-specific timeline.

---

## Stage 11: User Step Completion

### API

#### `POST /api/courses/steps/:stepId/complete`

### Result

Updates:

- completed steps
- total steps
- progress percent
- completion state if fully done

### Why this stage exists

Course progress must reflect actual training progress.

---

## Stage 12: Daily Task Completion

### API

#### `POST /api/courses/daily-tasks/:taskId/complete`

### Result

Updates:

- daily task log
- current streak
- longest streak
- last task completed date

### Important rule

Task is only valid if it matches the user’s course day since join.

### Why this exists

The course habit layer is intentionally sequential and date-based.

---

## Stage 13: Resume Learning

### API

#### `GET /api/courses/:courseId/resume`

### Why this stage exists

User should immediately know:

- next lecture
- next step
- current task

This reduces friction for repeat learning sessions.

---

## Stage 14: Reporting

### API

#### `POST /api/courses/:courseId/report`

### Result

Creates a moderation signal on the course.

### Why this stage exists

Users need a safety path when course content feels wrong or harmful.

---

## Stage 15: Report Review

### APIs

#### `PATCH /api/admin/course-reports/:reportId/resolve`

#### `PATCH /api/admin/course-reports/:reportId/dismiss`

### Result

Super admin can:

- resolve report
- dismiss report
- optionally freeze course during resolution

### Why this stage exists

Reporting only matters if moderation can close the loop.

---

## Deleted Course Behavior

### API

#### `DELETE /api/admin/courses/:courseId`

### Meaning

Course is soft deleted.

### Why this exists

Allows operational removal without immediately destroying relational history.

---

## Lecture / Step / Daily Task Deletes

### APIs

#### `DELETE /api/admin/lectures/:lectureId`

#### `DELETE /api/admin/steps/:stepId`

#### `DELETE /api/admin/daily-tasks/:taskId`

### Why these exist

Granular content correction is better than deleting an entire course.

---

## Lifecycle Summary Table

### Draft

Meaning:

- content in progress

### Pending Review

Meaning:

- waiting for super admin decision

### Approved

Meaning:

- editorially accepted

### Rejected

Meaning:

- needs trainer changes

### Online

Meaning:

- visible to users

### Offline

Meaning:

- hidden from users without deleting

### Frozen

Meaning:

- moderated / restricted

### Deleted

Meaning:

- soft removed from active use

---

## Why this lifecycle design is good

It separates different concerns:

- creation
- approval
- publication
- moderation
- user learning

That means:

- trainer can still work without publishing
- super admin can approve without permanent visibility
- moderation can stop access without deleting everything
- user progress can remain structured

---

## Suggested Future Lifecycle Docs

- `phase_2_paid_course_lifecycle.md`
- `trainer_resubmission_flow.md`
- `course_visibility_rules.md`

