import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export type AdminJwtPayload = {
  sub: string;
  role: string;
};

const passwordIterations = 120000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, passwordDigest)
    .toString("hex");

  return `${passwordIterations}:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [iterationsRaw, salt, expectedHash] = storedHash.split(":");
  const iterations = Number(iterationsRaw);

  if (!iterations || !salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto
    .pbkdf2Sync(password, salt, iterations, passwordKeyLength, passwordDigest)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

export async function loginAdmin(input: { email: string; password: string }) {
  const admin = await prisma.adminUser.findUnique({ where: { email: input.email } });

  if (!admin || !admin.isActive || admin.isFrozen || !verifyPassword(input.password, admin.passwordHash)) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  });

  const token = jwt.sign({ role: admin.role }, env.JWT_SECRET, {
    subject: admin.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
      profilePicture: admin.profilePicture,
      bio: admin.bio,
      expertise: admin.expertise,
      experienceYears: admin.experienceYears
    },
    token
  };
}

const adminSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  profilePicture: true,
  bio: true,
  expertise: true,
  experienceYears: true,
  isActive: true,
  isFrozen: true,
  freezeReason: true,
  frozenAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true
};

export async function listAdmins(input: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    role: "ADMIN" as const,
    ...(input.search
      ? {
          OR: [
            { email: { contains: input.search } },
            { name: { contains: input.search } },
            { expertise: { contains: input.search } }
          ]
        }
      : {}),
    ...(input.status === "ACTIVE"
      ? { isActive: true, isFrozen: false }
      : input.status === "FROZEN"
        ? { isFrozen: true }
        : input.status === "INACTIVE"
          ? { isActive: false }
          : {})
  };
  const [admins, total] = await Promise.all([
    prisma.adminUser.findMany({
      where,
      select: adminSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.adminUser.count({ where })
  ]);
  return { admins, total };
}

export async function createAdmin(input: {
  email: string;
  password: string;
  role?: "SUPER_ADMIN" | "ADMIN";
  name?: string;
  profilePicture?: string;
  bio?: string;
  expertise?: string;
  experienceYears?: number;
}) {
  const admin = await prisma.adminUser.create({
    data: {
      email: input.email,
      passwordHash: hashPassword(input.password),
      role: input.role ?? "ADMIN",
      name: input.name,
      profilePicture: input.profilePicture,
      bio: input.bio,
      expertise: input.expertise,
      experienceYears: input.experienceYears
    },
    select: adminSelect
  });

  return admin;
}

export async function updateAdminStatus(adminId: string, isActive: boolean, reason?: string) {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });

  if (!admin) {
    throw new ApiError(404, "Trainer not found");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.adminUser.update({
      where: { id: adminId },
      data: {
        isActive,
        isFrozen: !isActive,
        freezeReason: !isActive ? reason ?? "Frozen by super admin" : null,
        frozenAt: !isActive ? new Date() : null
      },
      select: adminSelect
    });

    if (!isActive) {
      await tx.trainingCourse.updateMany({
        where: { trainerId: adminId, deletedAt: null },
        data: {
          isPublished: false,
          isFrozen: true,
          freezeReason: reason ?? "Trainer account frozen by super admin",
          frozenAt: new Date()
        }
      });
    } else {
      await tx.trainingCourse.updateMany({
        where: { trainerId: adminId, deletedAt: null },
        data: {
          isFrozen: false,
          freezeReason: null,
          frozenAt: null
        }
      });
    }

    return updated;
  });
}

export async function updateAdminProfile(
  adminId: string,
  input: Partial<{
    name: string | null;
    profilePicture: string | null;
    bio: string | null;
    expertise: string | null;
    experienceYears: number | null;
  }>
) {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });

  if (!admin) {
    throw new ApiError(404, "Trainer not found");
  }

  return prisma.adminUser.update({
    where: { id: adminId },
    data: input,
    select: adminSelect
  });
}

export async function updateAdminCredentials(
  adminId: string,
  input: Partial<{
    email: string;
    password: string;
  }>
) {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });

  if (!admin) {
    throw new ApiError(404, "Trainer not found");
  }

  return prisma.adminUser.update({
    where: { id: adminId },
    data: {
      email: input.email,
      passwordHash: input.password ? hashPassword(input.password) : undefined
    },
    select: adminSelect
  });
}

export async function getTrainerDetail(adminId: string) {
  const trainer = await prisma.adminUser.findFirst({
    where: { id: adminId, role: "ADMIN" },
    select: {
      ...adminSelect,
      courses: {
        where: { deletedAt: null },
        include: {
          reports: {
            where: { status: "OPEN" },
            select: { id: true }
          },
          _count: {
            select: {
              lectures: true,
              dailyTasks: true,
              enrollments: true,
              reports: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!trainer) {
    throw new ApiError(404, "Trainer not found");
  }

  const totalCompletions = await prisma.userCourseEnrollment.count({
    where: {
      course: { trainerId: adminId },
      completedAt: { not: null }
    }
  });

  const openReportCount = await prisma.courseReport.count({
    where: {
      course: { trainerId: adminId },
      status: "OPEN"
    }
  });

  const courses = trainer.courses.map((course) => ({
    ...course,
    openReportCount: course.reports.length
  }));

  return {
    trainer: {
      ...trainer,
      courses
    },
    stats: {
      courseCount: courses.length,
      activeCourseCount: courses.filter((course) => course.isPublished).length,
      frozenCourseCount: courses.filter((course) => course.isFrozen).length,
      totalEnrollments: courses.reduce(
        (sum, course) => sum + (course._count?.enrollments ?? 0),
        0
      ),
      totalReports: courses.reduce((sum, course) => sum + (course._count?.reports ?? 0), 0),
      openReportCount,
      totalViews: courses.reduce((sum, course) => sum + course.viewCount, 0),
      totalCompletions
    }
  };
}

export async function getAdminDashboardStats() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    userCount,
    trainerCount,
    activeTrainerCount,
    frozenTrainerCount,
    courseCount,
    frozenCourseCount,
    premiumCourseCount,
    pendingApprovalCount,
    enrollmentCount,
    completionCount,
    openReportCount,
    newUsersLast7Days,
    newEnrollmentsLast7Days,
    newReportsLast7Days,
    newCoursesLast7Days,
    topTrainersRaw,
    trendingCoursesRaw
  ] =
    await Promise.all([
      prisma.user.count(),
      prisma.adminUser.count({ where: { role: "ADMIN" } }),
      prisma.adminUser.count({ where: { role: "ADMIN", isActive: true } }),
      prisma.adminUser.count({ where: { role: "ADMIN", isFrozen: true } }),
      prisma.trainingCourse.count({ where: { deletedAt: null } }),
      prisma.trainingCourse.count({ where: { deletedAt: null, isFrozen: true } }),
      prisma.trainingCourse.count({ where: { deletedAt: null, isPremium: true } }),
      prisma.trainingCourse.count({ where: { deletedAt: null, approvalStatus: "PENDING_REVIEW" } }),
      prisma.userCourseEnrollment.count(),
      prisma.userCourseEnrollment.count({ where: { completedAt: { not: null } } }),
      prisma.courseReport.count({ where: { status: "OPEN" } }),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.userCourseEnrollment.count({ where: { joinedAt: { gte: since } } }),
      prisma.courseReport.count({ where: { createdAt: { gte: since } } }),
      prisma.trainingCourse.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
      prisma.adminUser.findMany({
        where: { role: "ADMIN" },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          expertise: true,
          isActive: true,
          isFrozen: true,
          courses: {
            where: { deletedAt: null },
            select: {
              id: true,
              viewCount: true,
              _count: {
                select: { enrollments: true, reports: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.trainingCourse.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          category: true,
          viewCount: true,
          trainer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          enrollments: {
            where: { joinedAt: { gte: since } },
            select: { id: true }
          },
          reports: {
            where: { createdAt: { gte: since } },
            select: { id: true }
          }
        }
      })
    ]);

  const topTrainers = topTrainersRaw
    .map((trainer) => ({
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      profilePicture: trainer.profilePicture,
      expertise: trainer.expertise,
      isActive: trainer.isActive,
      isFrozen: trainer.isFrozen,
      courseCount: trainer.courses.length,
      enrollmentCount: trainer.courses.reduce((sum, course) => sum + course._count.enrollments, 0),
      reportCount: trainer.courses.reduce((sum, course) => sum + course._count.reports, 0),
      totalViews: trainer.courses.reduce((sum, course) => sum + course.viewCount, 0)
    }))
    .sort((left, right) => right.enrollmentCount - left.enrollmentCount)
    .slice(0, 5);

  const topCoursesLast7Days = trendingCoursesRaw
    .map((course) => ({
      id: course.id,
      title: course.title,
      category: course.category,
      trainerName: course.trainer?.name ?? course.trainer?.email ?? "Unassigned",
      viewCount: course.viewCount,
      enrollmentCount: course.enrollments.length,
      reportCount: course.reports.length
    }))
    .sort((left, right) => {
      if (right.enrollmentCount !== left.enrollmentCount) {
        return right.enrollmentCount - left.enrollmentCount;
      }

      if (right.viewCount !== left.viewCount) {
        return right.viewCount - left.viewCount;
      }

      return left.reportCount - right.reportCount;
    })
    .slice(0, 5);

  return {
    userCount,
    trainerCount,
    activeTrainerCount,
    frozenTrainerCount,
    courseCount,
    frozenCourseCount,
    premiumCourseCount,
    pendingApprovalCount,
    enrollmentCount,
    completionCount,
    openReportCount,
    newUsersLast7Days,
    newEnrollmentsLast7Days,
    newReportsLast7Days,
    newCoursesLast7Days,
    topTrainers,
    topCoursesLast7Days
  };
}
