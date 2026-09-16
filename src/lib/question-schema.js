import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const questionFrontmatterSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(1),
  slug: z.string().trim().regex(slugPattern).optional(),
  categories: z.array(z.string().trim().min(1)).min(1),
  authorId: z.string().trim().min(1).optional(),
  published: z.boolean().default(true),
  suppressAuthor: z.boolean().default(false),
  relatedAnswers: z.array(z.string().trim().regex(slugPattern)).default([]),
});
