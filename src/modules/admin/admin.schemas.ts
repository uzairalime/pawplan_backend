import { z } from "zod";
import { ADMIN_ROLES } from "../../constants/domain.js";

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1)
  })
});

export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(8),
    role: z.enum(ADMIN_ROLES).optional(),
    name: z.string().min(1).max(120).optional(),
    profilePicture: z.string().url().optional(),
    bio: z.string().max(2000).optional(),
    expertise: z.string().max(500).optional(),
    experienceYears: z.number().int().min(0).max(80).optional()
  })
});

export const updateAdminProfileSchema = z.object({
  params: z.object({
    adminId: z.string().min(1)
  }),
  body: z
    .object({
      name: z.string().min(1).max(120).nullable().optional(),
      profilePicture: z.string().url().nullable().optional(),
      bio: z.string().max(2000).nullable().optional(),
      expertise: z.string().max(500).nullable().optional(),
      experienceYears: z.number().int().min(0).max(80).nullable().optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export const updateAdminCredentialsSchema = z.object({
  params: z.object({
    adminId: z.string().min(1)
  }),
  body: z
    .object({
      email: z.string().email().toLowerCase().optional(),
      password: z.string().min(8).optional()
    })
    .refine((value) => Object.keys(value).length > 0, "At least one field is required")
});

export const adminIdParamsSchema = z.object({
  params: z.object({
    adminId: z.string().min(1)
  })
});

export const updateAdminStatusSchema = z.object({
  params: adminIdParamsSchema.shape.params,
  body: z.object({
    reason: z.string().min(1).max(1000).optional()
  })
});
