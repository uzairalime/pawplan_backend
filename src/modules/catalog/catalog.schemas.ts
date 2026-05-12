import { z } from "zod";

export const catalogIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const createCatalogItemSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120),
    icon: z.string().max(120).optional(),
    shortDescription: z.string().max(500).optional()
  })
});
