import { z } from "zod";
import { COURSE_REPORT_REASONS } from "../../constants/domain.js";

export const courseIdParamsSchema = z.object({
  params: z.object({
    courseId: z.string().min(1)
  })
});

export const lectureIdParamsSchema = z.object({
  params: z.object({
    lectureId: z.string().min(1)
  })
});

export const stepIdParamsSchema = z.object({
  params: z.object({
    stepId: z.string().min(1)
  })
});

export const taskIdParamsSchema = z.object({
  params: z.object({
    taskId: z.string().min(1)
  })
});

export const reportIdParamsSchema = z.object({
  params: z.object({
    reportId: z.string().min(1)
  })
});

export const rejectCourseSchema = z.object({
  params: courseIdParamsSchema.shape.params,
  body: z.object({
    reason: z.string().min(1).max(1000)
  })
});

const dailyTaskInputSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  dayNumber: z.number().int().positive()
});

export const reportCourseSchema = z.object({
  params: courseIdParamsSchema.shape.params,
  body: z.object({
    reason: z.enum(COURSE_REPORT_REASONS),
    details: z.string().max(2000).optional()
  })
});

export const reviewReportSchema = z.object({
  params: reportIdParamsSchema.shape.params,
  body: z.object({
    reviewNote: z.string().max(2000).optional(),
    freezeCourse: z.boolean().optional()
  })
});

export const freezeCourseSchema = z.object({
  params: courseIdParamsSchema.shape.params,
  body: z.object({
    reason: z.string().min(1).max(1000)
  })
});

const courseLevelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

const stepInputSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).optional()
});

const lectureInputSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  videoUrl: z.string().url().optional(),
  videoKey: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  steps: z.array(stepInputSchema).optional()
});

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(2000).optional(),
    category: z.string().min(1).max(80).optional(),
    level: courseLevelSchema.optional(),
    estimatedDays: z.number().int().positive().optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    isPremium: z.boolean().optional(),
    priceAmount: z.number().int().positive().optional(),
    currencyCode: z.string().min(3).max(3).optional(),
    thumbnailUrl: z.string().url().optional(),
    thumbnailKey: z.string().max(500).optional(),
    trainerId: z.string().min(1).optional(),
    isPublished: z.boolean().optional(),
    lectures: z.array(lectureInputSchema).optional(),
    dailyTasks: z.array(dailyTaskInputSchema).optional()
  })
});

export const updateCourseSchema = z.object({
  params: courseIdParamsSchema.shape.params,
  body: z
    .object({
      title: z.string().min(1).max(160).optional(),
      description: z.string().max(2000).nullable().optional(),
      category: z.string().min(1).max(80).nullable().optional(),
      level: courseLevelSchema.optional(),
      estimatedDays: z.number().int().positive().nullable().optional(),
      estimatedMinutes: z.number().int().positive().nullable().optional(),
      isPremium: z.boolean().optional(),
      priceAmount: z.number().int().positive().nullable().optional(),
      currencyCode: z.string().min(3).max(3).nullable().optional(),
      thumbnailUrl: z.string().url().nullable().optional(),
      thumbnailKey: z.string().max(500).nullable().optional(),
      trainerId: z.string().min(1).nullable().optional(),
      isPublished: z.boolean().optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export const addLectureSchema = z.object({
  params: courseIdParamsSchema.shape.params,
  body: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(2000).optional(),
    videoUrl: z.string().url().optional(),
    videoKey: z.string().max(500).optional(),
    sortOrder: z.number().int().min(0).optional(),
    steps: z.array(stepInputSchema).optional(),
    dailyTasks: z.array(dailyTaskInputSchema).optional()
  })
});

export const updateLectureSchema = z.object({
  params: lectureIdParamsSchema.shape.params,
  body: z
    .object({
      title: z.string().min(1).max(160).optional(),
      description: z.string().max(2000).nullable().optional(),
      videoUrl: z.string().url().nullable().optional(),
      videoKey: z.string().max(500).nullable().optional(),
      sortOrder: z.number().int().min(0).optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export const addStepSchema = z.object({
  params: lectureIdParamsSchema.shape.params,
  body: stepInputSchema
});

export const updateStepSchema = z.object({
  params: stepIdParamsSchema.shape.params,
  body: z
    .object({
      title: z.string().min(1).max(160).optional(),
      description: z.string().max(2000).nullable().optional(),
      sortOrder: z.number().int().min(0).optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export const createDailyTaskSchema = z.object({
  params: courseIdParamsSchema.shape.params,
  body: dailyTaskInputSchema
});

export const updateDailyTaskSchema = z.object({
  params: taskIdParamsSchema.shape.params,
  body: z
    .object({
      title: z.string().min(1).max(160).optional(),
      description: z.string().max(2000).nullable().optional(),
      dayNumber: z.number().int().positive().optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});
