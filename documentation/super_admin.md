# Super Admin Documentation

## Purpose

This document explains every super admin capability in PawPlan.

It covers:

- which APIs are used by super admin
- what each API does
- why the API exists
- which admin-portal screen or button uses it
- why that screen action exists from a business point of view

This is written for product, backend, frontend, QA, and future team members.

---

## Role Model

PawPlan has two admin-side roles:

### 1. `SUPER_ADMIN`

Full control role.

Can:

- manage trainers
- manage users
- approve or reject trainer courses
- freeze or unfreeze courses
- manage quotes
- manage catalog items
- review reports
- view audit logs
- export operational CSV data
- see platform-level dashboard analytics

### 2. `ADMIN`

This is the trainer role.

Can:

- login to admin portal
- create and manage only their own courses
- add lectures, steps, and daily tasks
- submit course for review
- see rejection reason
- view their own course analytics

### Important Access Rule

Even though Swagger groups many endpoints under the same `Admin` tag, trainer does **not** get super admin access.

Backend protection is enforced through:

- `requireAdmin`
- `requireSuperAdmin`

Code reference:

- [src/middleware/admin.ts](/Users/apple/Documents/New%20project/src/middleware/admin.ts)

So:

- shared admin tag in Swagger: yes
- shared permissions: no

---

## Authentication

### API

#### `POST /api/admin/login`

### What it does

Authenticates an admin account and returns:

- admin profile
- role
- JWT token

### Why we use it

This is the entry point for both:

- super admin
- trainer

The returned role controls what the user can see and do in the admin portal.

### Portal usage

Screen:

- `admin-portal/src/app/login/page.tsx`

Button:

- `Login`

### Why this button exists

Without login, there is no secure role-based admin access.

### Extra notes

- login has rate limiting
- invalid credentials return `401`
- too many attempts return `429`

---

## Super Admin Navigation

Super admin sees these primary sections in the portal:

- Dashboard
- Courses
- Catalog
- Quotes
- Approvals
- Reports
- Audit Logs
- Users
- Trainers

Code reference:

- [admin-portal/src/components/AdminShell.tsx](/Users/apple/Documents/New%20project/admin-portal/src/components/AdminShell.tsx)

### Why these navigation items exist

They split responsibilities into clear operational areas:

- content moderation
- trainer management
- user management
- reporting
- system observation

---

## Dashboard

### API

#### `GET /api/admin/dashboard-stats`

### What it does

Returns platform-level stats such as:

- total users
- total trainers
- active trainers
- frozen trainers
- total courses
- frozen courses
- premium-ready course count
- pending approval count
- joined course count
- completed course count
- open report count
- new users in last 7 days
- new enrollments in last 7 days
- new reports in last 7 days
- new courses in last 7 days
- top trainers
- top active courses in last 7 days

### Why we use it

Super admin needs one screen to understand:

- growth
- moderation pressure
- trainer activity
- course performance

### Portal usage

Screen:

- [admin-portal/src/app/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/page.tsx)

### Buttons / visible functionality

Dashboard itself is mostly view-only.

Visible functions:

- counts
- trend cards
- top trainers table
- top courses table

### Why those functions exist

- counts help operational monitoring
- trends help short-term decision making
- top trainers help identify strongest contributors
- top courses help spot popular or risky content quickly

---

## Trainers

## 1. List trainers

### API

#### `GET /api/admin/trainers`

### What it does

Returns paginated trainer list with:

- identity
- profile info
- active/frozen status
- timestamps

### Why we use it

Super admin needs a single place to manage all trainers.

### Portal usage

Screen:

- [admin-portal/src/app/admins/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/admins/page.tsx)

### Page functionality

- search trainers
- filter by status
- paginate results
- open trainer detail
- freeze / activate trainer

### Why these functions exist

- search helps when trainer count grows
- status filters separate active and problematic trainers
- pagination keeps large lists usable
- detail page supports deeper moderation and profile review

---

## 2. Create trainer

### API

#### `POST /api/admin/trainers`

### What it does

Creates a trainer account with:

- email
- password
- name
- profile picture
- bio
- expertise
- experience years

### Why we use it

Trainer onboarding is controlled by super admin, not self-signup.

This keeps trainer quality and access controlled.

### Portal usage

Screen:

- [admin-portal/src/app/admins/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/admins/page.tsx)

Button:

- `Create trainer`

### Why this button exists

Because trainer accounts should be approved and created by the platform, not freely opened.

---

## 3. Trainer detail

### API

#### `GET /api/admin/trainers/:adminId`

### What it does

Returns:

- trainer profile
- trainer courses
- trainer aggregate stats
  - course count
  - active course count
  - frozen course count
  - total enrollments
  - total reports
  - total views
  - total completions

### Why we use it

Super admin often needs more than a list row.

This endpoint supports trainer-level review and moderation.

### Portal usage

Screen:

- [admin-portal/src/app/admins/[adminId]/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/admins/%5BadminId%5D/page.tsx)

### Functions on this screen

- view trainer profile
- view trainer stats
- update profile
- update credentials
- freeze / unfreeze trainer
- freeze / unfreeze trainer courses

### Why these functions exist

- profile review helps course credibility
- trainer stats help performance analysis
- course freeze from trainer view helps faster moderation during investigations

---

## 4. Update trainer profile

### API

#### `PATCH /api/admin/trainers/:adminId/profile`

### What it does

Updates trainer public-facing profile fields.

### Why we use it

Trainer profile may need correction or cleanup for the user-facing course experience.

### Portal usage

Screen:

- trainer detail page

Button:

- `Save profile`

### Why this button exists

Super admin must be able to correct trainer-facing identity and expertise data without recreating the account.

---

## 5. Update trainer credentials

### API

#### `PATCH /api/admin/trainers/:adminId/credentials`

### What it does

Updates:

- trainer email
- trainer password

### Why we use it

Needed when:

- trainer email changes
- trainer loses access
- support reset is needed

### Portal usage

Screen:

- trainer detail page

Button:

- `Save credentials`

### Why this button exists

Admin operations often require account recovery without deleting and recreating the trainer.

---

## 6. Activate trainer

### API

#### `PATCH /api/admin/trainers/:adminId/activate`

### What it does

Reactivates a trainer account.

### Why we use it

Used after:

- investigation completion
- accidental freeze
- policy resolution

### Portal usage

Buttons:

- trainer list page active toggle
- trainer detail page active toggle

### Why this button exists

Moderation should be reversible when appropriate.

---

## 7. Deactivate / freeze trainer

### API

#### `PATCH /api/admin/trainers/:adminId/deactivate`

### What it does

Freezes the trainer account and also hides/freeze-effects that trainer’s courses from user visibility.

### Why we use it

If a trainer is unsafe or under review, their courses should stop being publicly accessible.

### Portal usage

Buttons:

- trainer list freeze button
- trainer detail freeze button

Prompt:

- freeze reason

### Why this button exists

The platform needs a fast trust-and-safety control at the account level.

---

## Users

## 1. List users

### API

#### `GET /api/admin/users`

### What it does

Returns paginated app-user list with moderation-related status.

### Why we use it

Super admin needs user operations for support, abuse review, and manual correction.

### Portal usage

Screen:

- [admin-portal/src/app/users/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/users/page.tsx)

### Functions

- search users
- filter by status
- open detail
- freeze
- unblock / block
- delete

### Why these functions exist

- support and moderation work need direct account handling
- lifecycle controls protect platform quality

---

## 2. User detail

### API

#### `GET /api/admin/users/:userId`

### What it does

Returns:

- full user profile
- joined courses
- report history
- counts

### Why we use it

List pages are not enough for support or moderation review.

### Portal usage

Screen:

- [admin-portal/src/app/users/[userId]/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/users/%5BuserId%5D/page.tsx)

### Functions

- edit profile fields
- freeze/unfreeze
- block/unblock
- inspect joined courses
- inspect report history

---

## 3. Update user

### API

#### `PATCH /api/admin/users/:userId`

### What it does

Updates user profile/admin-editable fields.

### Why we use it

Useful for support corrections or manual cleanup.

### Portal usage

Button:

- `Save changes`

---

## 4. Freeze user

### API

#### `PATCH /api/admin/users/:userId/freeze`

### What it does

Freezes user access.

### Why we use it

Used for temporary restriction or investigation.

### Portal usage

Buttons:

- users list freeze button
- user detail `Freeze`

Prompt:

- freeze reason

---

## 5. Unfreeze user

### API

#### `PATCH /api/admin/users/:userId/unfreeze`

### What it does

Restores frozen user access.

### Why we use it

Needed when a moderation action is cleared.

### Portal usage

Button:

- `Unfreeze`

---

## 6. Block user

### API

#### `PATCH /api/admin/users/:userId/block`

### What it does

Blocks the user from using the product.

### Why we use it

Stronger than freeze, used for abuse or permanent restriction.

### Portal usage

Buttons:

- users list block button
- user detail `Block`

Prompt:

- block reason

---

## 7. Unblock user

### API

#### `PATCH /api/admin/users/:userId/unblock`

### What it does

Reverses block state.

### Why we use it

Allows moderation recovery when needed.

### Portal usage

Button:

- `Unblock`

---

## 8. Delete user

### API

#### `DELETE /api/admin/users/:userId`

### What it does

Soft deletes the user.

### Why we use it

Supports account removal without destroying operational history immediately.

### Portal usage

Button:

- delete icon on users list

### Why this button exists

Platform operations need controlled account removal.

---

## Courses

## 1. List admin courses

### API

#### `GET /api/admin/courses`

### What it does

Lists courses visible to the logged-in admin.

For super admin:

- all courses

For trainer:

- only own courses

### Why we use it

This is the main content management index.

### Portal usage

Screen:

- [admin-portal/src/app/courses/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/courses/page.tsx)

### Super admin functions on this page

- search
- filter by level/status
- open course detail
- online/offline course
- submit review status viewing
- delete course

### Why these functions exist

- content volume eventually becomes large
- moderation needs quick surface-level controls
- lifecycle state should be visible before opening detail

---

## 2. Pending approvals

### API

#### `GET /api/admin/courses-pending-approval`

### What it does

Returns only courses waiting for super admin review.

### Why we use it

Separates moderation workflow from the full course library.

### Portal usage

Screen:

- [admin-portal/src/app/approvals/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/approvals/page.tsx)

### Buttons

- `Approve`
- `Reject`
- `Refresh`

### Why these buttons exist

- approval clears content for release
- rejection prevents low-quality or unsafe content from reaching users
- refresh supports live review workflow

---

## 3. Course detail

### APIs

#### `GET /api/admin/courses/:courseId`

#### `GET /api/admin/courses/:courseId/analytics`

### What they do

Return:

- course content
- lectures
- steps
- daily tasks
- analytics
- moderation state

### Why we use them

Super admin needs a full review surface before approving, rejecting, or freezing content.

### Portal usage

Screen:

- [admin-portal/src/app/courses/[courseId]/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/courses/%5BcourseId%5D/page.tsx)

### Buttons and reasons

#### `Approve`

API:

- `PATCH /api/admin/courses/:courseId/approve`

Why:

- makes validated course eligible for release

#### `Reject`

API:

- `PATCH /api/admin/courses/:courseId/reject`

Why:

- communicates required changes back to trainer

#### `Go online` / `Go offline`

APIs:

- `PATCH /api/admin/courses/:courseId/online`
- `PATCH /api/admin/courses/:courseId/offline`

Why:

- visibility control without deleting the course

#### `Freeze` / `Unfreeze`

APIs:

- `PATCH /api/admin/courses/:courseId/freeze`
- `PATCH /api/admin/courses/:courseId/unfreeze`

Why:

- trust-and-safety control at course level

#### `Save course`

API:

- `PATCH /api/admin/courses/:courseId`

Why:

- lets super admin correct content metadata or ownership details

#### `Save lecture`

API:

- `PATCH /api/admin/lectures/:lectureId`

Why:

- lecture-specific editorial correction

#### `Delete lecture`

API:

- `DELETE /api/admin/lectures/:lectureId`

Why:

- removes problematic or outdated lecture material

#### `Save step`

API:

- `PATCH /api/admin/steps/:stepId`

Why:

- training instructions sometimes need precise correction

#### `Delete step`

API:

- `DELETE /api/admin/steps/:stepId`

Why:

- removes unsafe or redundant step instructions

#### `Save daily task`

API:

- `PATCH /api/admin/daily-tasks/:taskId`

Why:

- keeps user daily journey aligned with course plan

#### `Delete daily task`

API:

- `DELETE /api/admin/daily-tasks/:taskId`

Why:

- removes bad or duplicated task items

---

## Reports

## 1. List reports

### API

#### `GET /api/admin/course-reports`

### What it does

Returns user-submitted course reports.

### Why we use it

Users need a moderation path when course content is:

- unsafe
- wrong
- spammy
- low quality

### Portal usage

Screen:

- [admin-portal/src/app/reports/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/reports/page.tsx)

### Functions

- search reports
- filter by status
- resolve
- dismiss

---

## 2. Resolve report

### API

#### `PATCH /api/admin/course-reports/:reportId/resolve`

### What it does

Marks report resolved.

Can also freeze course during resolution.

### Why we use it

Allows moderation action with auditability.

### Portal usage

Button:

- `Resolve`

Extra prompt:

- optional review note
- optional freeze course confirmation

### Why this button exists

Super admin needs a one-step moderation action that can also immediately protect users.

---

## 3. Dismiss report

### API

#### `PATCH /api/admin/course-reports/:reportId/dismiss`

### What it does

Dismisses a report when no action is needed.

### Why we use it

Not every report is valid, but every report should still be reviewed and closed.

### Portal usage

Button:

- `Dismiss`

Prompt:

- optional dismiss note

---

## Quotes

## 1. List quotes

### API

#### `GET /api/admin/quotes`

### What it does

Returns admin-created quotes.

### Why we use it

Super admin controls platform-curated motivational content.

### Portal usage

Screen:

- [admin-portal/src/app/quotes/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/quotes/page.tsx)

### Functions

- view current cached quote
- search quote library
- create quote
- refresh daily quote
- delete quote

---

## 2. Create quote

### API

#### `POST /api/admin/quotes`

### Why

Allows platform-owned content instead of only public fallback quotes.

### Button

- `Add quote`

---

## 3. Refresh quote

### API

#### `POST /api/admin/quotes/refresh`

### Why

Used to force immediate quote refresh instead of waiting for the scheduled 12-hour cache window.

### Button

- `Refresh now`

---

## 4. Delete quote

### API

#### `DELETE /api/admin/quotes/:quoteId`

### Why

Lets super admin remove poor-quality or duplicated quote content.

### Button

- delete icon in quote table

---

## Catalog

Catalog means:

- breeds
- training goals

## 1. List public catalog

### APIs

#### `GET /api/breeds`

#### `GET /api/training-goals`

### Why super admin uses them

Portal needs live catalog list while editing catalog entries.

### Portal usage

Screen:

- [admin-portal/src/app/catalog/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/catalog/page.tsx)

### Functions

- search catalog
- paginate breeds
- paginate training goals

---

## 2. Create breed

### API

#### `POST /api/admin/breeds`

### Why

Breed is part of onboarding and user profile structure.

### Button

- `Add breed`

### Why this button exists

Catalog should evolve without code changes.

---

## 3. Delete breed

### API

#### `DELETE /api/admin/breeds/:id`

### Why

Allows cleanup of duplicate, wrong, or deprecated breed entries.

### Button

- delete icon in breeds table

---

## 4. Create training goal

### API

#### `POST /api/admin/training-goals`

### Why

Training goals shape user onboarding and matching.

### Button

- `Add goal`

---

## 5. Delete training goal

### API

#### `DELETE /api/admin/training-goals/:id`

### Why

Needed for catalog cleanup and deprecation.

### Button

- delete icon in goals table

---

## Audit Logs

### API

#### `GET /api/admin/audit-logs`

### What it does

Returns recorded admin-side action history.

Examples:

- trainer create
- trainer freeze
- course approve
- course reject
- user block
- quote delete

### Why we use it

Super admin needs accountability and operational traceability.

### Portal usage

Screen:

- [admin-portal/src/app/audit-logs/page.tsx](/Users/apple/Documents/New%20project/admin-portal/src/app/audit-logs/page.tsx)

### Functions

- search
- filter by action
- filter by target type
- pagination
- refresh

### Why these functions exist

Audit logs become noisy over time, so filtering is required for investigation work.

---

## CSV Exports

### APIs

#### `GET /api/admin/exports/users.csv`

#### `GET /api/admin/exports/trainers.csv`

#### `GET /api/admin/exports/courses.csv`

#### `GET /api/admin/exports/reports.csv`

### What they do

Return CSV downloads for operations and reporting.

### Why we use them

Super admin often needs exportable data for:

- reporting
- support
- audits
- spreadsheet review
- manual operations

### Current note

Backend export APIs are ready.

If export buttons are not yet added in every UI screen, frontend can connect them later.

---

## Shared Supporting APIs Super Admin Uses

These are not exclusive to super admin, but super admin relies on them:

### `GET /api/admin/courses/:courseId/analytics`

Used to inspect:

- enrollment count
- average progress
- completion rate
- active streak users
- report counts
- views

Why:

- helps moderation and performance decisions

### `POST /api/uploads/course-thumbnail`

Why:

- course visual identity and review quality

### `POST /api/uploads/course-video`

Why:

- video-based course content management

---

## Portal Buttons Summary

Below is a direct feature-to-reason summary.

### Refresh buttons

Present on many pages.

Reason:

- reload latest backend state after moderation or edits

### Create trainer

Reason:

- controlled trainer onboarding

### Freeze trainer

Reason:

- stop unsafe or problematic trainer content quickly

### Save trainer profile / credentials

Reason:

- support and data correction

### Freeze / block user

Reason:

- platform trust and safety

### Approve / reject course

Reason:

- content gate before user visibility

### Online / offline course

Reason:

- visibility control without deleting content

### Freeze / unfreeze course

Reason:

- emergency moderation at content level

### Resolve / dismiss report

Reason:

- close user safety loop with explicit moderation outcome

### Add quote / refresh quote / delete quote

Reason:

- editorial control over daily motivational content

### Add breed / goal / delete breed / goal

Reason:

- maintain onboarding and catalog quality without code deployment

---

## Security and Access Notes

- trainer cannot call super-admin-only APIs successfully
- backend returns `403` for those routes
- portal hides super-admin-only navigation items based on role
- authentication token stores role, but backend still verifies permissions server-side

---

## Frontend State Note

Current admin portal does **not** use a separate state management library like Redux or Zustand.

It currently uses:

- `useState`
- `useEffect`
- API helper methods
- localStorage session

This is acceptable for current scope.

Future recommendation:

- TanStack Query for server-state management when the app grows

---

## Suggested Future Doc Files

To complete the documentation folder later, useful next files would be:

- `trainer.md`
- `user_app.md`
- `course_lifecycle.md`
- `reports_and_moderation.md`
- `phase_2_payments.md`

