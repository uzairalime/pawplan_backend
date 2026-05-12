import { z } from "zod";
import { GENDERS } from "../../constants/domain.js";

export const userIdParamsSchema = z.object({
  params: z.object({
    userId: z.string().min(1)
  })
});

export const updateUserAdminSchema = z.object({
  params: userIdParamsSchema.shape.params,
  body: z
    .object({
      email: z.string().email().toLowerCase().optional(),
      profilePicture: z.string().url().nullable().optional(),
      dogName: z.string().min(1).max(80).nullable().optional(),
      dogAge: z.number().int().min(0).max(40).nullable().optional(),
      gender: z.enum(GENDERS).nullable().optional(),
      bio: z.string().max(2000).nullable().optional(),
      breedId: z.string().min(1).nullable().optional(),
      trainingGoalIds: z.array(z.string().min(1)).optional(),
      isProfileCompleted: z.boolean().optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export const userModerationSchema = z.object({
  params: userIdParamsSchema.shape.params,
  body: z.object({
    reason: z.string().min(1).max(1000).optional()
  })
});
