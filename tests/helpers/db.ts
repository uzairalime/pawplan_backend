import { prisma } from "../../src/db/prisma.js";
import { hashPassword } from "../../src/modules/admin/admin.service.js";

export async function resetDatabase() {
  await prisma.userCourseDailyTaskLog.deleteMany();
  await prisma.userCourseStepCompletion.deleteMany();
  await prisma.userCourseEnrollment.deleteMany();
  await prisma.courseReport.deleteMany();
  await prisma.courseDailyTask.deleteMany();
  await prisma.trainingCourseStep.deleteMany();
  await prisma.trainingCourseLecture.deleteMany();
  await prisma.trainingCourse.deleteMany();
  await prisma.userTrainingGoal.deleteMany();
  await prisma.emailOtp.deleteMany();
  await prisma.quoteCache.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.trainingGoal.deleteMany();
  await prisma.breed.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.auditLog.deleteMany();
}

export async function createSuperAdmin() {
  return prisma.adminUser.create({
    data: {
      email: "super@pawplan.com",
      passwordHash: hashPassword("Password@123"),
      role: "SUPER_ADMIN",
      name: "Super Admin"
    }
  });
}

export async function createTrainer(overrides: Partial<{ email: string; isActive: boolean; isFrozen: boolean }> = {}) {
  return prisma.adminUser.create({
    data: {
      email: overrides.email ?? "trainer@pawplan.com",
      passwordHash: hashPassword("Password@123"),
      role: "ADMIN",
      name: "Trainer",
      isActive: overrides.isActive ?? true,
      isFrozen: overrides.isFrozen ?? false
    }
  });
}

export async function createUser(email = "user@pawplan.com") {
  return prisma.user.create({
    data: {
      email,
      isProfileCompleted: true
    }
  });
}
