import { z } from "zod";
import { GENDERS } from "../../constants/domain.js";

export const updateProfileSchema = z.object({
  body: z
    .object({
      profilePicture: z.string().url().max(1000).optional(),
      dogName: z.string().min(1).max(80).optional(),
      dogAge: z.number().int().min(0).max(40).optional(),
      gender: z.enum(GENDERS).optional(),
      breedId: z.string().min(1).optional(),
      trainingGoalIds: z.array(z.string().min(1)).optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});
