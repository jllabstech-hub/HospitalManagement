import { z } from 'zod';

export const CreateNewsArticleSchema = z.object({
  title: z.string().trim().min(1, { message: 'Required field.' }),
  excerpt: z.string().trim().optional().or(z.literal('')),
  content: z.string().trim().min(1, { message: 'Required field.' }),
  coverImageUrl: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type CreateNewsArticleInput = z.infer<typeof CreateNewsArticleSchema>;

export const UpdateNewsArticleSchema = CreateNewsArticleSchema.extend({
  id: z.string().uuid(),
});

export type UpdateNewsArticleInput = z.infer<typeof UpdateNewsArticleSchema>;
