# PawPlan Admin Portal

Next.js frontend for PawPlan admins.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Backend API should be running at:

```text
http://localhost:4000
```

If your backend URL changes:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Admin Login

```text
Email: admin@pawplan.com
Password: Password@123
```

## Screens

- Dashboard
- Courses
- Catalog
- Quotes
- Trainers

The Courses screen supports search/filter, thumbnail upload, video upload, course creation with lectures, steps, daily tasks, online/offline status, delete confirmations, and previews.

Click a course title to open course details. Admin can edit course info, lectures, steps, videos, daily tasks, and view analytics.

The Trainers screen is visible to `SUPER_ADMIN` users only.
