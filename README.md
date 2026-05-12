# PawPlan API

Backend API for PawPlan, a dog training app with OTP auth, onboarding profile, training courses, progress tracking, streaks, and admin course management.

## Quick Start

```bash
cd ~/Documents/pawplan_backend
npm install
npm run prisma:generate
npm run seed
npm run dev
```

API base URL:

```text
http://localhost:4000
```

Recommended versioned API base:

```text
http://localhost:4000/api/v1
```

Legacy compatibility path:

```text
http://localhost:4000/api
```

Swagger:

```text
http://localhost:4000/docs
```

Readiness check:

```text
http://localhost:4000/ready
```

Admin portal:

```bash
cd ~/Documents/pawplan_backend/admin-portal
npm install
npm run dev
```

Portal URL:

```text
http://localhost:3000
```

Admin login:

```text
Email: admin@pawplan.com
Password: Password@123
```

Prisma Studio:

```bash
npm run prisma:studio
```

If schema changes during development:

```bash
npx prisma db push --accept-data-loss
npm run seed
```

Reset local demo data for frontend or QA:

```bash
npm run db:reset:demo
```

Phase 1 QA checklist:

```text
QA_CHECKLIST.md
```

Architecture note:

```text
docs/ARCHITECTURE.md
```

## Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- SQLite for local development
- JWT auth
- Static OTP for development
- Multer uploads
- Local storage or S3 storage
- Swagger UI
- Next.js admin portal

## Environment

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-this-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"

ADMIN_API_KEY="pawplan-admin"
ADMIN_EMAIL="admin@pawplan.com"
ADMIN_PASSWORD="Password@123"

STORAGE_DRIVER="local"
AWS_REGION=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET_NAME=""
AWS_S3_PUBLIC_BASE_URL=""
```

For S3 uploads, set:

```env
STORAGE_DRIVER="s3"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="your-bucket"
AWS_S3_PUBLIC_BASE_URL=""
```

`AWS_S3_PUBLIC_BASE_URL` is optional and can later be a CloudFront URL.

## Common Response Rules

Success responses use `200` or `201`.

Error responses include `statusCode`:

```json
{
  "statusCode": 400,
  "message": "Validation failed"
}
```

Paginated list responses include a `meta` object:

```json
{
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Protected user routes require:

```http
Authorization: Bearer <user-token>
```

Admin routes accept either:

```http
Authorization: Bearer <admin-token>
```

or:

```http
x-admin-key: pawplan-admin
```

## Admin Portal Frontend

The Next.js admin portal lives in:

```text
admin-portal
```

Create an environment file if the API URL changes:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Portal features:

- Database-backed admin login with `SUPER_ADMIN` and trainer `ADMIN` roles.
- Dashboard counts for courses, offline courses, catalog items, and quotes.
- Super admin trend cards for the last 7 days and top active courses.
- Course search and filters by title/category, level, and online/offline/deleted state.
- Course creation with thumbnail upload, video upload, first lecture, steps, and daily tasks.
- Add lecture against an existing course.
- Course detail editing for course info, lectures, steps, videos, and daily tasks.
- Image and video previews before saving.
- Confirmation prompts before destructive admin actions.
- Publish validation so incomplete courses stay in draft/offline mode.
- Course analytics for enrollments, progress, completion rate, and streaks.
- Super admin trainer management.
- Trainer detail moderation filters for frozen courses and courses with open reports.
- Super admin audit log screen.
- Audit log action badges, target links, and structured metadata formatting.
- Paginated admin screens for trainers, users, courses, approvals, reports, quotes, and catalog.
- Put courses offline or online.
- Delete admin-created courses.
- Create and delete breeds.
- Create and delete training goals.
- Create, refresh, and delete dog-lover daily quotes.
- CSV export endpoints for users, trainers, courses, and reports.

Backend must be running on port `4000` before using the portal.

## Tests

Prepare the test database:

```bash
npm run test:setup
```

Run the critical business-rule suite:

```bash
npm run test
```

Run both in one step:

```bash
npm run test:all
```

## Operational Notes

- OTP request, resend, verify, and admin login now have in-memory rate limiting.
- Upload limits are centralized for profile images, course thumbnails, and course videos.
- `npm run seed` now creates demo trainer, demo users, a demo course, a demo quote, and a demo moderation report.
- `npm run db:reset:demo` force-resets the local SQLite database, regenerates Prisma client, reseeds demo data, and refreshes `prisma/test.db` for QA.
- Super admin CSV exports:
  - `GET /api/admin/exports/users.csv`
  - `GET /api/admin/exports/trainers.csv`
  - `GET /api/admin/exports/courses.csv`
  - `GET /api/admin/exports/reports.csv`

## App Frontend Guide

### 1. Request OTP

```http
POST /api/auth/request-otp
```

```json
{
  "email": "user@pawplan.app"
}
```

Development response:

```json
{
  "message": "OTP sent successfully",
  "email": "user@pawplan.app",
  "expiresInSeconds": 60,
  "otp": "1122"
}
```

OTP is valid for 1 minute.

### 2. Resend OTP

```http
POST /api/auth/resend-otp
```

```json
{
  "email": "user@pawplan.app"
}
```

This resets OTP validity to 1 minute.

### 3. Verify OTP

```http
POST /api/auth/verify-otp
```

```json
{
  "email": "user@pawplan.app",
  "otp": "1122"
}
```

If the email is new, the API creates the user.

Response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@pawplan.app",
    "profilePicture": null,
    "dogName": null,
    "dogAge": null,
    "gender": null,
    "breedId": null,
    "isProfileCompleted": false,
    "breed": null,
    "trainingGoals": []
  },
  "token": "jwt-token",
  "isNewUser": true
}
```

Frontend behavior:

- If `isProfileCompleted` is `false`, send user to complete profile.
- Save `token` and pass it as bearer token for protected APIs.

### 4. Get Profile

```http
GET /api/profile
Authorization: Bearer <user-token>
```

### 5. Upload Profile Image

```http
POST /api/uploads/profile-image
Authorization: Bearer <user-token>
Content-Type: multipart/form-data
```

Form field:

```text
image
```

Response:

```json
{
  "url": "http://localhost:4000/uploads/profile-images/file.png",
  "key": "profile-images/file.png"
}
```

Then save the image URL in profile:

```http
PATCH /api/profile
Authorization: Bearer <user-token>
```

```json
{
  "profilePicture": "http://localhost:4000/uploads/profile-images/file.png"
}
```

### 6. Profile Completion

```http
PATCH /api/profile
Authorization: Bearer <user-token>
```

You can save profile in parts:

```json
{
  "dogName": "Milo"
}
```

Full profile example:

```json
{
  "profilePicture": "http://localhost:4000/uploads/profile-images/file.png",
  "dogName": "Milo",
  "dogAge": 2,
  "gender": "MALE",
  "breedId": "breed-id",
  "trainingGoalIds": ["goal-id-1", "goal-id-2"]
}
```

`isProfileCompleted` becomes `true` when these exist:

- `dogName`
- `dogAge`
- `gender`
- `breedId`
- at least one `trainingGoalId`

Profile picture is optional for completion.

### 7. Catalog APIs

```http
GET /api/breeds
GET /api/training-goals
```

Use these IDs in `PATCH /api/profile`.

### 8. Course APIs

List courses:

```http
GET /api/courses
```

Get course detail:

```http
GET /api/courses/:courseId
```

List my joined courses:

```http
GET /api/courses/my-courses
Authorization: Bearer <user-token>
```

Join course:

```http
POST /api/courses/:courseId/join
Authorization: Bearer <user-token>
```

Get my progress:

```http
GET /api/courses/:courseId/progress
Authorization: Bearer <user-token>
```

Resume course:

```http
GET /api/courses/:courseId/resume
Authorization: Bearer <user-token>
```

Returns the next incomplete lecture/step and today’s task.

Get daily task completion history:

```http
GET /api/courses/:courseId/daily-task-history
Authorization: Bearer <user-token>
```

Mark step complete:

```http
POST /api/courses/steps/:stepId/complete
Authorization: Bearer <user-token>
```

Complete daily task:

```http
POST /api/courses/daily-tasks/:taskId/complete
Authorization: Bearer <user-token>
```

Progress is calculated from completed steps:

```text
completedStepsCount / totalStepsCount
```

Daily task behavior:

- User day number is calculated from the course `joinedAt` date.
- If user joins today, today is `dayNumber: 1`.
- Tomorrow is `dayNumber: 2`.
- User can only complete the daily task for their current course day.

Streak behavior:

- Completing daily tasks on consecutive UTC days increments `currentStreak`.
- Missing a day means the next completion resets `currentStreak` to `1`.
- `longestStreak` stores the best streak.

Soft-deleted courses, lectures, and steps are hidden from user APIs.

### 9. Daily Quote

```http
GET /api/daily-quote
```

Returns one quote for dog lovers. It changes every 12 hours.

Behavior:

- If admin has active quotes, the API shows one admin quote.
- If admin has no active quote, the API tries a public motivational quote API.
- If the public API is unavailable, the API uses built-in PawPlan fallback quotes.

Response:

```json
{
  "quote": {
    "id": "daily-dog-quote",
    "quoteId": "admin-quote-id",
    "text": "Small training moments become big trust over time.",
    "author": "PawPlan",
    "source": "admin",
    "expiresAt": "2026-05-06T06:00:00.000Z"
  }
}
```

## Admin Frontend Guide

### 1. Admin Login

```http
POST /api/admin/login
```

```json
{
  "email": "admin@pawplan.com",
  "password": "Password@123"
}
```

Response:

```json
{
  "admin": {
    "id": "admin-id",
    "email": "admin@pawplan.com",
    "role": "SUPER_ADMIN"
  },
  "token": "admin-jwt-token"
}
```

Use:

```http
Authorization: Bearer <admin-token>
```

Super admin trainer management:

```http
GET /api/admin/trainers
POST /api/admin/trainers
GET /api/admin/trainers/:adminId
PATCH /api/admin/trainers/:adminId/activate
PATCH /api/admin/trainers/:adminId/deactivate
PATCH /api/admin/trainers/:adminId/profile
PATCH /api/admin/trainers/:adminId/credentials
GET /api/admin/dashboard-stats
Authorization: Bearer <admin-token>
```

Super admin user management:

```http
GET /api/admin/users
GET /api/admin/users/:userId
PATCH /api/admin/users/:userId
PATCH /api/admin/users/:userId/freeze
PATCH /api/admin/users/:userId/unfreeze
PATCH /api/admin/users/:userId/block
PATCH /api/admin/users/:userId/unblock
DELETE /api/admin/users/:userId
Authorization: Bearer <admin-token>
```

- `freeze` temporarily stops user access.
- `block` disables user access until unblocked.
- `delete` is soft delete and also blocks the account.

Audit logs:

```http
GET /api/admin/audit-logs?page=1&limit=20
Authorization: Bearer <admin-token>
```

Pagination:

- Public mobile-friendly lists now support `page` and `limit`:
  - `GET /api/courses`
  - `GET /api/courses/my-courses`
  - `GET /api/breeds`
  - `GET /api/training-goals`
- Admin lists now support `page`, `limit`, and selected `search/status` filters:
  - trainers
  - users
  - courses
  - pending approvals
  - reports
  - quotes

Postman collection:

- [postman/PawPlan.postman_collection.json](/Users/apple/Documents/New%20project/postman/PawPlan.postman_collection.json)

Create trainer body:

```json
{
  "email": "content@pawplan.com",
  "password": "Password@123",
  "role": "ADMIN",
  "name": "Ava Khan",
  "bio": "Force-free puppy trainer focused on calm routines.",
  "expertise": "Puppy training, leash manners",
  "experienceYears": 6
}
```

Trainers have public profile fields. Course responses include the assigned `trainer`, so the app can show the instructor on course listing/detail screens.

Course approval flow:

```http
PATCH /api/admin/courses/:courseId/submit-review
PATCH /api/admin/courses/:courseId/approve
PATCH /api/admin/courses/:courseId/reject
```

- Trainer creates course as `DRAFT`.
- Trainer submits course for review, status becomes `PENDING_REVIEW`.
- Super admin approves, status becomes `APPROVED` and course goes online.
- Super admin rejects with reason, status becomes `REJECTED`, and trainer can see `rejectionReason`.
- Freezing a trainer deactivates that trainer and hides all of their courses from user-facing course APIs.
- Super admin can freeze or unfreeze a course separately from online/offline state.
- Catalog and quote admin APIs are super-admin only.

Pending approvals:

```http
GET /api/admin/courses-pending-approval
Authorization: Bearer <admin-token>
```

Reports and moderation:

```http
POST /api/courses/:courseId/report
GET /api/admin/course-reports
PATCH /api/admin/course-reports/:reportId/resolve
PATCH /api/admin/course-reports/:reportId/dismiss
PATCH /api/admin/courses/:courseId/freeze
PATCH /api/admin/courses/:courseId/unfreeze
Authorization: Bearer <token>
```

Payment-ready course fields:

- `isPremium`
- `priceAmount`
- `currencyCode`

These are stored in the database now so paid courses can be added later without restructuring the main course table.

### 2. Create Breed

```http
POST /api/admin/breeds
Authorization: Bearer <admin-token>
```

```json
{
  "title": "Border Collie",
  "icon": "border-collie",
  "shortDescription": "Smart, energetic, and focused."
}
```

Delete breed:

```http
DELETE /api/admin/breeds/:id
Authorization: Bearer <admin-token>
```

This sets `isActive: false`, so the app no longer lists it.

### 3. Create Training Goal

```http
POST /api/admin/training-goals
Authorization: Bearer <admin-token>
```

```json
{
  "title": "Crate Training",
  "icon": "crate",
  "shortDescription": "Help the dog settle comfortably in a crate."
}
```

Delete training goal:

```http
DELETE /api/admin/training-goals/:id
Authorization: Bearer <admin-token>
```

This sets `isActive: false`, so the app no longer lists it.

### 4. Upload Course Video

```http
POST /api/uploads/course-video
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

Form field:

```text
video
```

Response:

```json
{
  "url": "http://localhost:4000/uploads/course-videos/file.mp4",
  "key": "course-videos/file.mp4"
}
```

Use `url` as `videoUrl` and `key` as `videoKey` when creating a lecture.

### 5. Upload Course Thumbnail

```http
POST /api/uploads/course-thumbnail
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

Form field:

```text
image
```

Use returned `url` as `thumbnailUrl` and returned `key` as `thumbnailKey`.

### 6. Create Training Course

```http
POST /api/admin/courses
Authorization: Bearer <admin-token>
```

```json
{
  "title": "Loose Leash Walking",
  "description": "Teach calmer walks with daily practice.",
  "category": "Leash Skills",
  "level": "BEGINNER",
  "estimatedDays": 14,
  "estimatedMinutes": 120,
  "thumbnailUrl": "https://example.com/course-thumbnail.png",
  "thumbnailKey": "course-thumbnails/course-thumbnail.png",
  "isPublished": true,
  "lectures": [
    {
      "title": "Getting Started",
      "description": "Prepare rewards and choose a quiet walking area.",
      "videoUrl": "https://example.com/video.mp4",
      "videoKey": "course-videos/video.mp4",
      "sortOrder": 1,
      "steps": [
        {
          "title": "Stand with your dog on your left side",
          "description": "Reward calm focus before moving.",
          "sortOrder": 1
        }
      ]
    }
  ],
  "dailyTasks": [
    {
      "title": "Practice loose leash walking for 10 minutes",
      "description": "Keep the session short and reward every calm check-in.",
      "dayNumber": 1
    }
  ]
}
```

`lectures` and `dailyTasks` are optional here. Admin can create the whole course in one request, or add lectures/tasks later.

### 7. List And View Admin Courses

```http
GET /api/admin/courses
GET /api/admin/courses/:courseId
Authorization: Bearer <admin-token>
```

Admin course APIs include draft, unpublished, and soft-deleted courses.

Course analytics:

```http
GET /api/admin/courses/:courseId/analytics
Authorization: Bearer <admin-token>
```

Response includes enrollment count, average progress, completion rate, completed count, active streak users, longest streak, step count, and task count.

### 8. Update Or Delete Course

```http
PATCH /api/admin/courses/:courseId
DELETE /api/admin/courses/:courseId
Authorization: Bearer <admin-token>
```

Use `PATCH` to update title, description, category, level, estimates, thumbnail, or publish state.
`DELETE` is a soft delete. It sets `deletedAt` and unpublishes the course.

Take course offline or online:

```http
PATCH /api/admin/courses/:courseId/offline
PATCH /api/admin/courses/:courseId/online
Authorization: Bearer <admin-token>
```

Offline courses have `isPublished: false`, so users cannot view them in app course APIs.
Publishing requires a thumbnail, at least one lecture, at least one step, and at least one daily task. Otherwise the API returns `400` and the course should remain draft/offline.

### 9. Add Lecture Against Course

```http
POST /api/admin/courses/:courseId/lectures
Authorization: Bearer <admin-token>
```

```json
{
  "title": "Getting Started",
  "description": "Prepare rewards and choose a quiet walking area.",
  "videoUrl": "https://example.com/video.mp4",
  "videoKey": "course-videos/video.mp4",
  "sortOrder": 1,
  "steps": [
    {
      "title": "Stand with your dog on your left side",
      "description": "Reward calm focus before moving.",
      "sortOrder": 1
    },
    {
      "title": "Take three slow steps",
      "description": "Reward when leash stays loose.",
      "sortOrder": 2
    }
  ],
  "dailyTasks": [
    {
      "title": "Practice this lecture for 10 minutes",
      "description": "Repeat the lecture exercise once today.",
      "dayNumber": 2
    }
  ]
}
```

`dailyTasks` is optional here too. When included, tasks are added against the course while the lecture is created.

### 10. Update Or Delete Lecture

```http
PATCH /api/admin/lectures/:lectureId
DELETE /api/admin/lectures/:lectureId
Authorization: Bearer <admin-token>
```

Use `PATCH` to update title, description, video fields, or `sortOrder`.
`DELETE` is a soft delete.

### 11. Add Step Against Lecture

```http
POST /api/admin/lectures/:lectureId/steps
Authorization: Bearer <admin-token>
```

```json
{
  "title": "Practice around mild distractions",
  "description": "Move to a slightly busier area and keep sessions short.",
  "sortOrder": 3
}
```

### 12. Update Or Delete Step

```http
PATCH /api/admin/steps/:stepId
DELETE /api/admin/steps/:stepId
Authorization: Bearer <admin-token>
```

Use `PATCH` to update title, description, or `sortOrder`.
`DELETE` is a soft delete.

### 13. Create, Update, Or Delete Course Daily Task

```http
POST /api/admin/courses/:courseId/daily-tasks
PATCH /api/admin/daily-tasks/:taskId
DELETE /api/admin/daily-tasks/:taskId
Authorization: Bearer <admin-token>
```

```json
{
  "title": "Practice loose leash walking for 10 minutes",
  "description": "Keep the session short and reward every calm check-in.",
  "dayNumber": 1
}
```

`dayNumber` should be unique per course.
Use `PATCH` to update title, description, or `dayNumber`.
Use `DELETE` to remove an admin-created daily task.

### 14. Manage Daily Quotes

List quotes:

```http
GET /api/admin/quotes
Authorization: Bearer <admin-token>
```

Create quote:

```http
POST /api/admin/quotes
Authorization: Bearer <admin-token>
```

```json
{
  "text": "A patient trainer builds a confident dog.",
  "author": "PawPlan",
  "isActive": true
}
```

Refresh current quote immediately:

```http
POST /api/admin/quotes/refresh
Authorization: Bearer <admin-token>
```

Delete/deactivate quote:

```http
DELETE /api/admin/quotes/:quoteId
Authorization: Bearer <admin-token>
```

## Endpoint Summary

### Public

- `GET /health`
- `GET /api/breeds`
- `GET /api/training-goals`
- `GET /api/daily-quote`
- `GET /api/courses`
- `GET /api/courses/:courseId`

### User App

- `POST /api/auth/request-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/verify-otp`
- `GET /api/auth/me`
- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/uploads/profile-image`
- `GET /api/courses/my-courses`
- `POST /api/courses/:courseId/join`
- `GET /api/courses/:courseId/progress`
- `GET /api/courses/:courseId/resume`
- `GET /api/courses/:courseId/daily-task-history`
- `POST /api/courses/steps/:stepId/complete`
- `POST /api/courses/daily-tasks/:taskId/complete`

User moderation behavior:

- blocked users cannot verify OTP into an active session
- frozen users cannot verify OTP into an active session
- blocked, frozen, or soft-deleted users cannot use authenticated user APIs
- paginated user/mobile-friendly list endpoints now return `meta`

### Admin

- `POST /api/admin/login`
- `POST /api/admin/breeds`
- `DELETE /api/admin/breeds/:id`
- `POST /api/admin/training-goals`
- `DELETE /api/admin/training-goals/:id`
- `POST /api/uploads/course-video`
- `POST /api/uploads/course-thumbnail`
- `GET /api/admin/courses`
- `GET /api/admin/courses/:courseId`
- `POST /api/admin/courses`
- `PATCH /api/admin/courses/:courseId`
- `PATCH /api/admin/courses/:courseId/offline`
- `PATCH /api/admin/courses/:courseId/online`
- `DELETE /api/admin/courses/:courseId`
- `POST /api/admin/courses/:courseId/lectures`
- `PATCH /api/admin/lectures/:lectureId`
- `DELETE /api/admin/lectures/:lectureId`
- `POST /api/admin/lectures/:lectureId/steps`
- `PATCH /api/admin/steps/:stepId`
- `DELETE /api/admin/steps/:stepId`
- `POST /api/admin/courses/:courseId/daily-tasks`
- `GET /api/admin/quotes`
- `POST /api/admin/quotes`
- `POST /api/admin/quotes/refresh`
- `DELETE /api/admin/quotes/:quoteId`
