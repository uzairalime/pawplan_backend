import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/db/prisma.js";
import { completeDailyTask } from "../src/modules/courses/course.service.js";
import { createUser, resetDatabase } from "./helpers/db.js";

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

test.beforeEach(async () => {
  await resetDatabase();
});

test.after(async () => {
  await prisma.$disconnect();
});

test("daily task completion increments a consecutive streak", async () => {
  const user = await createUser("streak@pawplan.com");
  const trainer = await prisma.adminUser.create({
    data: {
      email: "trainer-streak@pawplan.com",
      passwordHash: "skip",
      role: "ADMIN"
    }
  });

  const today = startOfUtcDay();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const course = await prisma.trainingCourse.create({
    data: {
      trainerId: trainer.id,
      title: "Streak Course",
      approvalStatus: "APPROVED",
      isPublished: true,
      dailyTasks: {
        create: [{ title: "Day 2 task", dayNumber: 2 }]
      }
    },
    include: { dailyTasks: true }
  });

  const enrollment = await prisma.userCourseEnrollment.create({
    data: {
      userId: user.id,
      courseId: course.id,
      joinedAt: yesterday,
      currentStreak: 1,
      longestStreak: 1,
      lastTaskCompletedDate: yesterday
    }
  });

  const updated = await completeDailyTask(user.id, course.dailyTasks[0]!.id);
  assert.equal(updated.currentStreak, 2);
  assert.equal(updated.longestStreak, 2);

  const refreshed = await prisma.userCourseEnrollment.findUniqueOrThrow({
    where: { id: enrollment.id }
  });
  assert.equal(refreshed.currentStreak, 2);
});

test("daily task completion resets the streak after a missed day", async () => {
  const user = await createUser("reset@pawplan.com");
  const trainer = await prisma.adminUser.create({
    data: {
      email: "trainer-reset@pawplan.com",
      passwordHash: "skip",
      role: "ADMIN"
    }
  });

  const today = startOfUtcDay();
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  const course = await prisma.trainingCourse.create({
    data: {
      trainerId: trainer.id,
      title: "Reset Course",
      approvalStatus: "APPROVED",
      isPublished: true,
      dailyTasks: {
        create: [{ title: "Day 3 task", dayNumber: 3 }]
      }
    },
    include: { dailyTasks: true }
  });

  const enrollment = await prisma.userCourseEnrollment.create({
    data: {
      userId: user.id,
      courseId: course.id,
      joinedAt: twoDaysAgo,
      currentStreak: 4,
      longestStreak: 4,
      lastTaskCompletedDate: twoDaysAgo
    }
  });

  const updated = await completeDailyTask(user.id, course.dailyTasks[0]!.id);
  assert.equal(updated.currentStreak, 1);
  assert.equal(updated.longestStreak, 4);

  const refreshed = await prisma.userCourseEnrollment.findUniqueOrThrow({
    where: { id: enrollment.id }
  });
  assert.equal(refreshed.currentStreak, 1);
});
