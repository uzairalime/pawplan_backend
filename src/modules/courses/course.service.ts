import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type CreateCourseInput = {
  trainerId?: string;
  title: string;
  description?: string;
  category?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedDays?: number;
  estimatedMinutes?: number;
  isPremium?: boolean;
  priceAmount?: number;
  currencyCode?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
  isPublished?: boolean;
  lectures?: LectureInput[];
  dailyTasks?: DailyTaskInput[];
};

type DailyTaskInput = {
  title: string;
  description?: string;
  dayNumber: number;
};

type LectureInput = {
  title: string;
  description?: string;
  videoUrl?: string;
  videoKey?: string;
  sortOrder?: number;
  steps?: Array<{
    title: string;
    description?: string;
    sortOrder?: number;
  }>;
  dailyTasks?: DailyTaskInput[];
};

type AddLectureInput = LectureInput;

type AddStepInput = {
  title: string;
  description?: string;
  sortOrder?: number;
};

type CreateDailyTaskInput = DailyTaskInput;

type UpdateDailyTaskInput = Partial<{
  title: string;
  description: string | null;
  dayNumber: number;
}>;

type UpdateCourseInput = Partial<{
  title: string;
  description: string | null;
  category: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedDays: number | null;
  estimatedMinutes: number | null;
  isPremium: boolean;
  priceAmount: number | null;
  currencyCode: string | null;
  thumbnailUrl: string | null;
  thumbnailKey: string | null;
  trainerId: string | null;
  isPublished: boolean;
}>;

type AdminContext = {
  id: string;
  role: string;
};

type UpdateLectureInput = Partial<{
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoKey: string | null;
  sortOrder: number;
}>;

type UpdateStepInput = Partial<{
  title: string;
  description: string | null;
  sortOrder: number;
}>;

type ReviewReportInput = {
  reviewNote?: string;
  freezeCourse?: boolean;
};

const courseInclude = {
  trainer: {
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
      bio: true,
      expertise: true,
      experienceYears: true,
      isFrozen: true
    }
  },
  lectures: {
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" as const },
    include: {
      steps: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" as const }
      }
    }
  },
  dailyTasks: {
    where: { deletedAt: null },
    orderBy: { dayNumber: "asc" as const }
  }
};

async function ensureTrainer(trainerId?: string | null) {
  if (!trainerId) {
    return null;
  }

  const trainer = await prisma.adminUser.findFirst({
    where: { id: trainerId, role: "ADMIN", isActive: true }
  });

  if (!trainer) {
    throw new ApiError(404, "Trainer not found");
  }

  return trainer;
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayDiff(previous: Date, next: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfUtcDay(next).getTime() - startOfUtcDay(previous).getTime()) / msPerDay);
}

async function ensureCourse(courseId: string) {
  const course = await prisma.trainingCourse.findFirst({ where: { id: courseId, deletedAt: null } });

  if (!course) {
    throw new ApiError(404, "Training course not found");
  }

  return course;
}

async function ensureAdminCanManageCourse(courseId: string, admin?: AdminContext) {
  const course = await ensureCourse(courseId);

  if (admin?.role === "ADMIN" && course.trainerId !== admin.id) {
    throw new ApiError(403, "You can only manage your own courses");
  }

  return course;
}

async function ensureAdminCanManageLecture(lectureId: string, admin?: AdminContext) {
  const lecture = await prisma.trainingCourseLecture.findFirst({
    where: { id: lectureId, deletedAt: null },
    include: {
      course: {
        select: { id: true, trainerId: true, deletedAt: true }
      }
    }
  });

  if (!lecture || lecture.course.deletedAt) {
    throw new ApiError(404, "Lecture not found");
  }

  if (admin?.role === "ADMIN" && lecture.course.trainerId !== admin.id) {
    throw new ApiError(403, "You can only manage your own courses");
  }

  return lecture;
}

async function ensureAdminCanManageStep(stepId: string, admin?: AdminContext) {
  const step = await prisma.trainingCourseStep.findFirst({
    where: { id: stepId, deletedAt: null },
    include: {
      lecture: {
        include: {
          course: {
            select: { id: true, trainerId: true, deletedAt: true }
          }
        }
      }
    }
  });

  if (!step || step.lecture.deletedAt || step.lecture.course.deletedAt) {
    throw new ApiError(404, "Training step not found");
  }

  if (admin?.role === "ADMIN" && step.lecture.course.trainerId !== admin.id) {
    throw new ApiError(403, "You can only manage your own courses");
  }

  return step;
}

async function ensureAdminCanManageTask(taskId: string, admin?: AdminContext) {
  const task = await prisma.courseDailyTask.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      course: {
        select: { id: true, trainerId: true, deletedAt: true }
      }
    }
  });

  if (!task || task.course.deletedAt) {
    throw new ApiError(404, "Daily task not found");
  }

  if (admin?.role === "ADMIN" && task.course.trainerId !== admin.id) {
    throw new ApiError(403, "You can only manage your own courses");
  }

  return task;
}

async function validateCourseCanPublish(courseId: string) {
  const course = await prisma.trainingCourse.findUnique({
    where: { id: courseId },
    include: courseInclude
  });

  if (!course || course.deletedAt) {
    throw new ApiError(404, "Training course not found");
  }

  if (!course.thumbnailUrl) {
    throw new ApiError(400, "Add a course thumbnail before publishing");
  }

  if (course.lectures.length === 0) {
    throw new ApiError(400, "Add at least one lecture before publishing");
  }

  if (!course.lectures.some((lecture) => lecture.steps.length > 0)) {
    throw new ApiError(400, "Add at least one training step before publishing");
  }

  if (course.dailyTasks.length === 0) {
    throw new ApiError(400, "Add at least one daily task before publishing");
  }

  if (course.isFrozen) {
    throw new ApiError(400, "Unfreeze this course before publishing");
  }

  if (course.trainerId && course.trainer?.isFrozen) {
    throw new ApiError(400, "Trainer is frozen");
  }
}

function validateCoursePricing(input: {
  isPremium?: boolean | null;
  priceAmount?: number | null;
  currencyCode?: string | null;
}) {
  if (input.isPremium && !input.priceAmount) {
    throw new ApiError(400, "Add a course price for premium courses");
  }

  if (input.isPremium && !input.currencyCode) {
    throw new ApiError(400, "Add a 3-letter currency code for premium courses");
  }
}

async function refreshProgress(userId: string, courseId: string) {
  const totalStepsCount = await prisma.trainingCourseStep.count({
    where: {
      deletedAt: null,
      lecture: { courseId, deletedAt: null, course: { deletedAt: null } }
    }
  });

  const completedStepsCount = await prisma.userCourseStepCompletion.count({
    where: {
      userId,
      step: {
        deletedAt: null,
        lecture: { courseId, deletedAt: null, course: { deletedAt: null } }
      }
    }
  });

  const progressPercent =
    totalStepsCount === 0 ? 0 : Math.round((completedStepsCount / totalStepsCount) * 100);

  return prisma.userCourseEnrollment.update({
    where: { userId_courseId: { userId, courseId } },
    data: {
      totalStepsCount,
      completedStepsCount,
      progressPercent,
      completedAt: progressPercent === 100 ? new Date() : null
    },
    include: { course: { include: courseInclude } }
  });
}

export async function createCourse(input: CreateCourseInput, admin?: AdminContext) {
  if (admin?.role === "ADMIN" && input.trainerId && input.trainerId !== admin.id) {
    throw new ApiError(403, "Trainer can only create courses for their own profile");
  }

  const fallbackTrainerId = admin?.role === "ADMIN" ? admin.id : undefined;
  const trainerId = input.trainerId ?? fallbackTrainerId;
  await ensureTrainer(trainerId);
  validateCoursePricing(input);

  return prisma.trainingCourse.create({
    data: {
      trainerId,
      title: input.title,
      description: input.description,
      category: input.category,
      level: input.level ?? "BEGINNER",
      estimatedDays: input.estimatedDays,
      estimatedMinutes: input.estimatedMinutes,
      isPremium: input.isPremium ?? false,
      priceAmount: input.priceAmount,
      currencyCode: input.currencyCode,
      thumbnailUrl: input.thumbnailUrl,
      thumbnailKey: input.thumbnailKey,
      isPublished: false,
      approvalStatus: "DRAFT",
      rejectionReason: null,
      lectures: input.lectures
        ? {
            create: input.lectures.map((lecture, lectureIndex) => ({
              title: lecture.title,
              description: lecture.description,
              videoUrl: lecture.videoUrl,
              videoKey: lecture.videoKey,
              sortOrder: lecture.sortOrder ?? lectureIndex,
              steps: lecture.steps
                ? {
                    create: lecture.steps.map((step, stepIndex) => ({
                      title: step.title,
                      description: step.description,
                      sortOrder: step.sortOrder ?? stepIndex
                    }))
                  }
                : undefined
            }))
          }
        : undefined,
      dailyTasks: input.dailyTasks
        ? {
            create: input.dailyTasks.map((task) => ({
              title: task.title,
              description: task.description,
              dayNumber: task.dayNumber
            }))
          }
        : undefined
    },
    include: courseInclude
  });
}

export async function updateCourse(courseId: string, input: UpdateCourseInput, admin?: AdminContext) {
  await ensureAdminCanManageCourse(courseId, admin);

  if (admin?.role === "ADMIN" && "trainerId" in input && input.trainerId !== admin.id) {
    throw new ApiError(403, "Trainer cannot reassign course ownership");
  }

  if ("trainerId" in input) {
    await ensureTrainer(input.trainerId);
  }

  validateCoursePricing(input);

  if (input.isPublished) {
    await validateCourseCanPublish(courseId);
  }

  return prisma.trainingCourse.update({
    where: { id: courseId },
    data: input,
    include: courseInclude
  });
}

export async function submitCourseForReview(courseId: string, admin?: AdminContext) {
  await ensureAdminCanManageCourse(courseId, admin);
  await validateCourseCanPublish(courseId);

  return prisma.trainingCourse.update({
    where: { id: courseId },
    data: {
      approvalStatus: "PENDING_REVIEW",
      isPublished: false,
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null
    },
    include: courseInclude
  });
}

export async function approveCourse(courseId: string, reviewerId: string) {
  await validateCourseCanPublish(courseId);

  return prisma.trainingCourse.update({
    where: { id: courseId },
    data: {
      approvalStatus: "APPROVED",
      isPublished: true,
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedById: reviewerId
    },
    include: courseInclude
  });
}

export async function rejectCourse(courseId: string, reviewerId: string, reason: string) {
  await ensureCourse(courseId);

  return prisma.trainingCourse.update({
    where: { id: courseId },
    data: {
      approvalStatus: "REJECTED",
      isPublished: false,
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedById: reviewerId
    },
    include: courseInclude
  });
}

export async function setCoursePublishStatus(courseId: string, isPublished: boolean) {
  const course = await ensureCourse(courseId);

  if (isPublished) {
    await validateCourseCanPublish(courseId);
  }

  if (isPublished && course.isFrozen) {
    throw new ApiError(400, "Unfreeze this course before publishing");
  }

  return prisma.trainingCourse.update({
    where: { id: courseId },
    data: { isPublished },
    include: courseInclude
  });
}

export async function setCourseFrozenStatus(
  courseId: string,
  isFrozen: boolean,
  adminId: string,
  reason?: string
) {
  await ensureCourse(courseId);

  return prisma.trainingCourse.update({
    where: { id: courseId },
    data: {
      isFrozen,
      freezeReason: isFrozen ? reason ?? "Frozen by super admin" : null,
      frozenAt: isFrozen ? new Date() : null,
      frozenById: isFrozen ? adminId : null,
      isPublished: isFrozen ? false : undefined
    },
    include: courseInclude
  });
}

export async function deleteCourse(courseId: string, admin?: AdminContext) {
  await ensureAdminCanManageCourse(courseId, admin);
  await prisma.trainingCourse.update({
    where: { id: courseId },
    data: { deletedAt: new Date(), isPublished: false }
  });
}

export async function addLecture(courseId: string, input: AddLectureInput, admin?: AdminContext) {
  await ensureAdminCanManageCourse(courseId, admin);

  return prisma.$transaction(async (tx) => {
    const lecture = await tx.trainingCourseLecture.create({
      data: {
        courseId,
        title: input.title,
        description: input.description,
        videoUrl: input.videoUrl,
        videoKey: input.videoKey,
        sortOrder: input.sortOrder ?? 0,
        steps: input.steps
          ? {
              create: input.steps.map((step, index) => ({
                title: step.title,
                description: step.description,
                sortOrder: step.sortOrder ?? index
              }))
            }
          : undefined
      },
      include: { steps: { orderBy: { sortOrder: "asc" } } }
    });

    if (input.dailyTasks) {
      await tx.courseDailyTask.createMany({
        data: input.dailyTasks.map((task) => ({
          courseId,
          title: task.title,
          description: task.description,
          dayNumber: task.dayNumber
        }))
      });
    }

    return lecture;
  });
}

export async function updateLecture(lectureId: string, input: UpdateLectureInput, admin?: AdminContext) {
  await ensureAdminCanManageLecture(lectureId, admin);

  return prisma.trainingCourseLecture.update({
    where: { id: lectureId },
    data: input,
    include: { steps: { orderBy: { sortOrder: "asc" } } }
  });
}

export async function deleteLecture(lectureId: string, admin?: AdminContext) {
  await ensureAdminCanManageLecture(lectureId, admin);

  await prisma.trainingCourseLecture.update({
    where: { id: lectureId },
    data: { deletedAt: new Date() }
  });
}

export async function addStep(lectureId: string, input: AddStepInput, admin?: AdminContext) {
  await ensureAdminCanManageLecture(lectureId, admin);

  return prisma.trainingCourseStep.create({
    data: {
      lectureId,
      title: input.title,
      description: input.description,
      sortOrder: input.sortOrder ?? 0
    }
  });
}

export async function updateStep(stepId: string, input: UpdateStepInput, admin?: AdminContext) {
  await ensureAdminCanManageStep(stepId, admin);

  return prisma.trainingCourseStep.update({
    where: { id: stepId },
    data: input
  });
}

export async function deleteStep(stepId: string, admin?: AdminContext) {
  await ensureAdminCanManageStep(stepId, admin);

  await prisma.trainingCourseStep.update({
    where: { id: stepId },
    data: { deletedAt: new Date() }
  });
}

export async function createDailyTask(courseId: string, input: CreateDailyTaskInput, admin?: AdminContext) {
  await ensureAdminCanManageCourse(courseId, admin);

  return prisma.courseDailyTask.create({
    data: {
      courseId,
      title: input.title,
      description: input.description,
      dayNumber: input.dayNumber
    }
  });
}

export async function updateDailyTask(taskId: string, input: UpdateDailyTaskInput, admin?: AdminContext) {
  await ensureAdminCanManageTask(taskId, admin);

  return prisma.courseDailyTask.update({
    where: { id: taskId },
    data: input
  });
}

export async function deleteDailyTask(taskId: string, admin?: AdminContext) {
  await ensureAdminCanManageTask(taskId, admin);

  await prisma.courseDailyTask.update({
    where: { id: taskId },
    data: { deletedAt: new Date() }
  });
}

export async function listCourses(input: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: string;
} = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    isPublished: true,
    isFrozen: false,
    deletedAt: null,
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search } },
            { category: { contains: input.search } }
          ]
        }
      : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.level ? { level: input.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" } : {}),
    OR: [{ trainerId: null }, { trainer: { isActive: true, isFrozen: false } }]
  };
  const [courses, total] = await Promise.all([
    prisma.trainingCourse.findMany({
      where,
      include: {
        trainer: courseInclude.trainer,
        _count: {
          select: { lectures: true, dailyTasks: true, reports: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.trainingCourse.count({ where })
  ]);
  return { courses, total };
}

export async function listAdminCourses(input: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  level?: string;
} = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search } },
            { category: { contains: input.search } }
          ]
        }
      : {}),
    ...(input.status === "FROZEN"
      ? { isFrozen: true }
      : input.status === "PENDING_REVIEW"
        ? { approvalStatus: "PENDING_REVIEW" as const }
        : input.status === "REJECTED"
          ? { approvalStatus: "REJECTED" as const }
          : input.status === "APPROVED"
            ? { approvalStatus: "APPROVED" as const }
          : input.status === "DRAFT"
              ? { approvalStatus: "DRAFT" as const }
              : {}),
    ...(input.level ? { level: input.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" } : {})
  };
  const [courses, total] = await Promise.all([
    prisma.trainingCourse.findMany({
      where,
      include: {
        trainer: courseInclude.trainer,
        _count: {
          select: { lectures: true, dailyTasks: true, enrollments: true, reports: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.trainingCourse.count({ where })
  ]);
  return { courses, total };
}

export async function listTrainerCourses(trainerId: string, input: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  level?: string;
} = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    trainerId,
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search } },
            { category: { contains: input.search } }
          ]
        }
      : {}),
    ...(input.status === "FROZEN"
      ? { isFrozen: true }
      : input.status === "PENDING_REVIEW"
        ? { approvalStatus: "PENDING_REVIEW" as const }
        : input.status === "REJECTED"
          ? { approvalStatus: "REJECTED" as const }
          : input.status === "APPROVED"
            ? { approvalStatus: "APPROVED" as const }
          : input.status === "DRAFT"
              ? { approvalStatus: "DRAFT" as const }
              : {}),
    ...(input.level ? { level: input.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" } : {})
  };
  const [courses, total] = await Promise.all([
    prisma.trainingCourse.findMany({
      where,
      include: {
        trainer: courseInclude.trainer,
        _count: {
          select: { lectures: true, dailyTasks: true, enrollments: true, reports: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.trainingCourse.count({ where })
  ]);
  return { courses, total };
}

export async function listMyCourses(userId: string, input: { page?: number; limit?: number } = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = { userId, course: { deletedAt: null } };
  const [enrollments, total] = await Promise.all([
    prisma.userCourseEnrollment.findMany({
      where,
      include: { course: { include: courseInclude } },
      orderBy: { joinedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.userCourseEnrollment.count({ where })
  ]);
  return { enrollments, total };
}

export async function getCourse(courseId: string) {
  const course = await prisma.trainingCourse.findFirst({
    where: {
      id: courseId,
      isPublished: true,
      isFrozen: false,
      deletedAt: null,
      OR: [{ trainerId: null }, { trainer: { isActive: true, isFrozen: false } }]
    },
    include: courseInclude
  });

  if (!course) {
    throw new ApiError(404, "Training course not found");
  }

  await prisma.trainingCourse.update({
    where: { id: courseId },
    data: { viewCount: { increment: 1 } }
  });

  return { ...course, viewCount: course.viewCount + 1 };
}

export async function getAdminCourse(courseId: string) {
  const course = await prisma.trainingCourse.findUnique({
    where: { id: courseId },
    include: {
      trainer: courseInclude.trainer,
      lectures: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: { steps: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } }
      },
      dailyTasks: { where: { deletedAt: null }, orderBy: { dayNumber: "asc" } },
      _count: { select: { enrollments: true, reports: true } }
    }
  });

  if (!course) {
    throw new ApiError(404, "Training course not found");
  }

  return course;
}

export async function getTrainerCourse(courseId: string, trainerId: string) {
  const course = await prisma.trainingCourse.findFirst({
    where: { id: courseId, trainerId },
    include: {
      trainer: courseInclude.trainer,
      lectures: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: { steps: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } }
      },
      dailyTasks: { where: { deletedAt: null }, orderBy: { dayNumber: "asc" } },
      _count: { select: { enrollments: true, reports: true } }
    }
  });

  if (!course) {
    throw new ApiError(404, "Training course not found");
  }

  return course;
}

export async function getCourseAnalytics(courseId: string) {
  await ensureCourse(courseId);

  const [course, enrollments, completedCount, stepCount, taskCount, reportCount, openReportCount] = await Promise.all([
    prisma.trainingCourse.findUnique({ where: { id: courseId }, select: { viewCount: true } }),
    prisma.userCourseEnrollment.findMany({
      where: { courseId },
      select: {
        progressPercent: true,
        currentStreak: true,
        longestStreak: true,
        completedAt: true
      }
    }),
    prisma.userCourseEnrollment.count({ where: { courseId, completedAt: { not: null } } }),
    prisma.trainingCourseStep.count({
      where: { deletedAt: null, lecture: { courseId, deletedAt: null } }
    }),
    prisma.courseDailyTask.count({ where: { courseId, deletedAt: null } }),
    prisma.courseReport.count({ where: { courseId } }),
    prisma.courseReport.count({ where: { courseId, status: "OPEN" } })
  ]);

  const enrollmentCount = enrollments.length;
  const averageProgress =
    enrollmentCount === 0
      ? 0
      : Math.round(
          enrollments.reduce((sum, enrollment) => sum + enrollment.progressPercent, 0) /
            enrollmentCount
        );

  const activeStreakUsers = enrollments.filter((enrollment) => enrollment.currentStreak > 0).length;
  const longestStreak = enrollments.reduce(
    (max, enrollment) => Math.max(max, enrollment.longestStreak),
    0
  );
  const completionRate =
    enrollmentCount === 0 ? 0 : Math.round((completedCount / enrollmentCount) * 100);

  return {
    enrollmentCount,
    averageProgress,
    completionRate,
    completedCount,
    activeStreakUsers,
    longestStreak,
    stepCount,
    taskCount,
    reportCount,
    openReportCount,
    viewCount: course?.viewCount ?? 0
  };
}

export async function listPendingApprovalCourses(input: { page?: number; limit?: number; search?: string } = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    deletedAt: null,
    approvalStatus: "PENDING_REVIEW" as const,
    ...(input.search ? { title: { contains: input.search } } : {})
  };
  const [courses, total] = await Promise.all([
    prisma.trainingCourse.findMany({
      where,
      include: {
        trainer: courseInclude.trainer,
        _count: {
          select: { lectures: true, dailyTasks: true, enrollments: true, reports: true }
        }
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.trainingCourse.count({ where })
  ]);
  return { courses, total };
}

export async function getTrainerCourseAnalytics(courseId: string, trainerId: string) {
  const course = await prisma.trainingCourse.findFirst({
    where: { id: courseId, trainerId, deletedAt: null },
    select: { id: true }
  });

  if (!course) {
    throw new ApiError(404, "Training course not found");
  }

  return getCourseAnalytics(courseId);
}

export async function joinCourse(userId: string, courseId: string) {
  await getCourse(courseId);

  const totalStepsCount = await prisma.trainingCourseStep.count({
    where: { deletedAt: null, lecture: { courseId, deletedAt: null } }
  });

  return prisma.userCourseEnrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: {
      userId,
      courseId,
      totalStepsCount
    },
    include: { course: { include: courseInclude } }
  });
}

export async function reportCourse(
  userId: string,
  courseId: string,
  input: { reason: string; details?: string }
) {
  await getCourse(courseId);

  return prisma.courseReport.create({
    data: {
      userId,
      courseId,
      reason: input.reason,
      details: input.details
    }
  });
}

export async function listCourseReports(input: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    ...(input.status ? { status: input.status as "OPEN" | "RESOLVED" | "DISMISSED" } : {}),
    ...(input.search
      ? {
          OR: [
            { details: { contains: input.search } },
            { course: { title: { contains: input.search } } },
            { user: { email: { contains: input.search } } }
          ]
        }
      : {})
  };
  const [reports, total] = await Promise.all([
    prisma.courseReport.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, dogName: true, profilePicture: true }
        },
        course: {
          select: {
            id: true,
            title: true,
            trainerId: true,
            isFrozen: true,
            freezeReason: true,
            trainer: courseInclude.trainer
          }
        },
        reviewedBy: {
          select: { id: true, email: true, name: true }
        }
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.courseReport.count({ where })
  ]);
  return { reports, total };
}

export async function resolveCourseReport(
  reportId: string,
  reviewerId: string,
  input: ReviewReportInput
) {
  const report = await prisma.courseReport.findUnique({
    where: { id: reportId },
    include: { course: true }
  });

  if (!report) {
    throw new ApiError(404, "Course report not found");
  }

  return prisma.$transaction(async (tx) => {
    if (input.freezeCourse) {
      await tx.trainingCourse.update({
        where: { id: report.courseId },
        data: {
          isFrozen: true,
          freezeReason: input.reviewNote ?? "Frozen from report review",
          frozenAt: new Date(),
          frozenById: reviewerId,
          isPublished: false
        }
      });
    }

    return tx.courseReport.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
        reviewedById: reviewerId
      },
      include: {
        user: { select: { id: true, email: true, dogName: true } },
        course: { select: { id: true, title: true } },
        reviewedBy: { select: { id: true, email: true, name: true } }
      }
    });
  });
}

export async function dismissCourseReport(
  reportId: string,
  reviewerId: string,
  input: ReviewReportInput
) {
  const report = await prisma.courseReport.findUnique({ where: { id: reportId } });

  if (!report) {
    throw new ApiError(404, "Course report not found");
  }

  return prisma.courseReport.update({
    where: { id: reportId },
    data: {
      status: "DISMISSED",
      reviewNote: input.reviewNote,
      reviewedAt: new Date(),
      reviewedById: reviewerId
    },
    include: {
      user: { select: { id: true, email: true, dogName: true } },
      course: { select: { id: true, title: true } },
      reviewedBy: { select: { id: true, email: true, name: true } }
    }
  });
}

export async function getMyCourseProgress(userId: string, courseId: string) {
  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: { course: { include: courseInclude } }
  });

  if (!enrollment) {
    throw new ApiError(404, "Course enrollment not found");
  }

  const completedSteps = await prisma.userCourseStepCompletion.findMany({
    where: {
      userId,
      step: { deletedAt: null, lecture: { courseId, deletedAt: null } }
    },
    select: { stepId: true, completedAt: true }
  });

  const today = startOfUtcDay();
  const todaysTask = await prisma.courseDailyTask.findFirst({
    where: { courseId, deletedAt: null, dayNumber: Math.max(1, dayDiff(enrollment.joinedAt, today) + 1) }
  });

  return {
    enrollment,
    completedSteps,
    todaysTask
  };
}

export async function getDailyTaskHistory(userId: string, courseId: string) {
  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true }
  });

  if (!enrollment) {
    throw new ApiError(404, "Course enrollment not found");
  }

  return prisma.userCourseDailyTaskLog.findMany({
    where: { userId, courseId },
    include: { task: true },
    orderBy: { taskDate: "desc" }
  });
}

export async function getCourseResume(userId: string, courseId: string) {
  const progress = await getMyCourseProgress(userId, courseId);
  const completedStepIds = new Set(progress.completedSteps.map((step) => step.stepId));
  const nextLecture = progress.enrollment.course.lectures.find((lecture) =>
    lecture.steps.some((step) => !completedStepIds.has(step.id))
  );
  const nextStep = nextLecture?.steps.find((step) => !completedStepIds.has(step.id)) ?? null;

  return {
    enrollment: progress.enrollment,
    nextLecture: nextLecture ?? null,
    nextStep,
    todaysTask: progress.todaysTask
  };
}

export async function completeStep(userId: string, stepId: string) {
  const step = await prisma.trainingCourseStep.findUnique({
    where: { id: stepId },
    include: { lecture: true }
  });

  if (!step || step.deletedAt || step.lecture.deletedAt) {
    throw new ApiError(404, "Training step not found");
  }

  const courseId = step.lecture.courseId;
  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });

  if (!enrollment) {
    throw new ApiError(404, "Join this course before completing steps");
  }

  await prisma.userCourseStepCompletion.upsert({
    where: { userId_stepId: { userId, stepId } },
    update: {},
    create: { userId, stepId }
  });

  return refreshProgress(userId, courseId);
}

export async function completeDailyTask(userId: string, taskId: string) {
  const task = await prisma.courseDailyTask.findFirst({
    where: { id: taskId, deletedAt: null }
  });

  if (!task) {
    throw new ApiError(404, "Daily task not found");
  }

  const enrollment = await prisma.userCourseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: task.courseId } }
  });

  if (!enrollment) {
    throw new ApiError(404, "Join this course before completing daily tasks");
  }

  const taskDate = startOfUtcDay();
  const expectedDayNumber = Math.max(1, dayDiff(enrollment.joinedAt, taskDate) + 1);

  if (task.dayNumber !== expectedDayNumber) {
    throw new ApiError(400, `Today is day ${expectedDayNumber} for this course`);
  }

  await prisma.userCourseDailyTaskLog.upsert({
    where: { userId_taskId_taskDate: { userId, taskId, taskDate } },
    update: {},
    create: {
      userId,
      taskId,
      courseId: task.courseId,
      taskDate
    }
  });

  const lastDate = enrollment.lastTaskCompletedDate;
  const isSameDay = lastDate ? dayDiff(lastDate, taskDate) === 0 : false;
  const isConsecutiveDay = lastDate ? dayDiff(lastDate, taskDate) === 1 : false;
  const currentStreak = isSameDay
    ? enrollment.currentStreak
    : isConsecutiveDay
      ? enrollment.currentStreak + 1
      : 1;

  return prisma.userCourseEnrollment.update({
    where: { userId_courseId: { userId, courseId: task.courseId } },
    data: {
      currentStreak,
      longestStreak: Math.max(enrollment.longestStreak, currentStreak),
      lastTaskCompletedDate: taskDate
    },
    include: { course: { include: courseInclude } }
  });
}
