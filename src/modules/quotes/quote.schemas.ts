import { z } from "zod";

export const quoteIdParamsSchema = z.object({
  params: z.object({
    quoteId: z.string().min(1)
  })
});

export const createQuoteSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(500),
    author: z.string().max(120).optional(),
    isActive: z.boolean().optional()
  })
});
