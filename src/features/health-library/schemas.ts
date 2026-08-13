import { z } from 'zod';

export const CreateHealthArticleSchema = z.object({
  title: z.string().trim().min(1, { message: 'Required field.' }),
  excerpt: z.string().trim().optional().or(z.literal('')),
  content: z.string().trim().min(1, { message: 'Required field.' }),
});

export type CreateHealthArticleInput = z.infer<typeof CreateHealthArticleSchema>;

export const UpdateHealthArticleSchema = CreateHealthArticleSchema.extend({
  id: z.string().uuid(),
});

export type UpdateHealthArticleInput = z.infer<typeof UpdateHealthArticleSchema>;
