import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/db/prisma.js";
import {
  dismissCourseReport,
  reportCourse,
  resolveCourseReport
} from "../src/modules/courses/course.service.js";
import { createSuperAdmin, createTrainer, createUser, resetDatabase } from "./helpers/db.js";

test.beforeEach(async () => {
  await resetDatabase();
});

test.after(async () => {
  await prisma.$disconnect();
});

test("resolving a report can freeze the course and record the review", async () => {
  const superAdmin = await createSuperAdmin();
  const trainer = await createTrainer();
  const user = await createUser("reporter@pawplan.com");

  const course = await prisma.trainingCourse.create({
    data: {
      trainerId: trainer.id,
      title: "Unsafe Course",
      approvalStatus: "APPROVED",
      isPublished: true
    }
  });

  const report = await reportCourse(user.id, course.id, {
    reason: "unsafe_training",
    details: "Uses risky corrections"
  });

  const resolved = await resolveCourseReport(report.id, superAdmin.id, {
    reviewNote: "Frozen pending rewrite",
    freezeCourse: true
  });

  assert.equal(resolved.status, "RESOLVED");
  assert.equal(resolved.reviewNote, "Frozen pending rewrite");

  const frozenCourse = await prisma.trainingCourse.findUniqueOrThrow({ where: { id: course.id } });
  assert.equal(frozenCourse.isFrozen, true);
  assert.equal(frozenCourse.isPublished, false);
});

test("dismissing a report leaves the course active and marks the report dismissed", async () => {
  const superAdmin = await createSuperAdmin();
  const trainer = await createTrainer({ email: "trainer-dismiss@pawplan.com" });
  const user = await createUser("dismiss-reporter@pawplan.com");

  const course = await prisma.trainingCourse.create({
    data: {
      trainerId: trainer.id,
      title: "Reviewed Course",
      approvalStatus: "APPROVED",
      isPublished: true
    }
  });

  const report = await reportCourse(user.id, course.id, {
    reason: "wrong_info",
    details: "This one is actually okay"
  });

  const dismissed = await dismissCourseReport(report.id, superAdmin.id, {
    reviewNote: "No action needed"
  });

  assert.equal(dismissed.status, "DISMISSED");
  assert.equal(dismissed.reviewNote, "No action needed");

  const activeCourse = await prisma.trainingCourse.findUniqueOrThrow({ where: { id: course.id } });
  assert.equal(activeCourse.isFrozen, false);
  assert.equal(activeCourse.isPublished, true);
});
