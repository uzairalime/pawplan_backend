import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../src/db/prisma.js";
import {
  approveCourse,
  createCourse,
  listCourses,
  rejectCourse,
  submitCourseForReview
} from "../src/modules/courses/course.service.js";
import { updateAdminStatus } from "../src/modules/admin/admin.service.js";
import { createSuperAdmin, createTrainer, resetDatabase } from "./helpers/db.js";

test.beforeEach(async () => {
  await resetDatabase();
});

test.after(async () => {
  await prisma.$disconnect();
});

test("freezing a trainer hides their published course from the public course list", async () => {
  const trainer = await createTrainer();

  const course = await prisma.trainingCourse.create({
    data: {
      trainerId: trainer.id,
      title: "Loose Leash Basics",
      approvalStatus: "APPROVED",
      isPublished: true
    }
  });

  const beforeFreeze = await listCourses();
  assert(beforeFreeze.courses.some((item) => item.id === course.id));

  await updateAdminStatus(trainer.id, false, "Policy review");

  const afterFreeze = await listCourses();
  assert.equal(afterFreeze.courses.some((item) => item.id === course.id), false);
});

test("course review flow updates draft, approval, and rejection state correctly", async () => {
  const trainer = await createTrainer();
  const superAdmin = await createSuperAdmin();

  const course = await createCourse(
    {
      title: "Recall Foundations",
      thumbnailUrl: "https://example.com/course.png",
      thumbnailKey: "course-thumbnails/recall.png",
      lectures: [
        {
          title: "Warm up",
          videoUrl: "https://example.com/video.mp4",
          videoKey: "course-videos/recall.mp4",
          steps: [{ title: "Say the cue" }]
        }
      ],
      dailyTasks: [{ title: "Practice recall", dayNumber: 1 }]
    },
    { id: trainer.id, role: "ADMIN" }
  );

  const pending = await submitCourseForReview(course.id, { id: trainer.id, role: "ADMIN" });
  assert.equal(pending.approvalStatus, "PENDING_REVIEW");
  assert.equal(pending.isPublished, false);

  const approved = await approveCourse(course.id, superAdmin.id);
  assert.equal(approved.approvalStatus, "APPROVED");
  assert.equal(approved.isPublished, true);

  const rejected = await rejectCourse(course.id, superAdmin.id, "Need clearer lecture structure");
  assert.equal(rejected.approvalStatus, "REJECTED");
  assert.equal(rejected.isPublished, false);
  assert.equal(rejected.rejectionReason, "Need clearer lecture structure");
});
