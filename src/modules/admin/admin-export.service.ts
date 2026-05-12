import { prisma } from "../../db/prisma.js";
import { toCsv } from "../../utils/csv.js";

export async function exportUsersCsv() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      breed: { select: { title: true } },
      _count: { select: { courseEnrollments: true, courseReports: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return toCsv(
    [
      "id",
      "email",
      "dogName",
      "breed",
      "isProfileCompleted",
      "isFrozen",
      "isBlocked",
      "joinedCourses",
      "reports",
      "createdAt"
    ],
    users.map((user) => [
      user.id,
      user.email,
      user.dogName,
      user.breed?.title,
      user.isProfileCompleted,
      user.isFrozen,
      user.isBlocked,
      user._count.courseEnrollments,
      user._count.courseReports,
      user.createdAt.toISOString()
    ])
  );
}

export async function exportTrainersCsv() {
  const trainers = await prisma.adminUser.findMany({
    where: { role: "ADMIN" },
    include: {
      courses: {
        where: { deletedAt: null },
        select: { id: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return toCsv(
    ["id", "email", "name", "expertise", "isActive", "isFrozen", "courseCount", "createdAt"],
    trainers.map((trainer) => [
      trainer.id,
      trainer.email,
      trainer.name,
      trainer.expertise,
      trainer.isActive,
      trainer.isFrozen,
      trainer.courses.length,
      trainer.createdAt.toISOString()
    ])
  );
}

export async function exportCoursesCsv() {
  const courses = await prisma.trainingCourse.findMany({
    where: { deletedAt: null },
    include: {
      trainer: { select: { name: true, email: true } },
      _count: { select: { lectures: true, dailyTasks: true, enrollments: true, reports: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return toCsv(
    [
      "id",
      "title",
      "trainer",
      "level",
      "category",
      "approvalStatus",
      "isPublished",
      "isFrozen",
      "lectures",
      "dailyTasks",
      "enrollments",
      "reports",
      "createdAt"
    ],
    courses.map((course) => [
      course.id,
      course.title,
      course.trainer?.name ?? course.trainer?.email,
      course.level,
      course.category,
      course.approvalStatus,
      course.isPublished,
      course.isFrozen,
      course._count.lectures,
      course._count.dailyTasks,
      course._count.enrollments,
      course._count.reports,
      course.createdAt.toISOString()
    ])
  );
}

export async function exportReportsCsv() {
  const reports = await prisma.courseReport.findMany({
    include: {
      user: { select: { email: true } },
      course: { select: { title: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return toCsv(
    ["id", "course", "userEmail", "reason", "status", "reviewNote", "createdAt"],
    reports.map((report) => [
      report.id,
      report.course.title,
      report.user.email,
      report.reason,
      report.status,
      report.reviewNote,
      report.createdAt.toISOString()
    ])
  );
}
