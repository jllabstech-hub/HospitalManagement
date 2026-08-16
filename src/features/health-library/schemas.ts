import { z } from 'zod';

export const CreateHealthArticleSchema = z.object({
  title: z.string().trim().min(1, { message: 'Required field.' }),
  excerpt: z.string().trim().optional().or(z.literal('')),
  content: z.string().trim().min(1, { message: 'Required field.' }),
  coverImageUrl: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type CreateHealthArticleInput = z.infer<typeof CreateHealthArticleSchema>;

export const UpdateHealthArticleSchema = CreateHealthArticleSchema.extend({
  id: z.string().uuid(),
});

export type UpdateHealthArticleInput = z.infer<typeof UpdateHealthArticleSchema>;
