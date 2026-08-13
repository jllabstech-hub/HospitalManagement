import { z } from 'zod';

export const CreateFaqItemSchema = z.object({
  question: z.string().trim().min(1, { message: 'Required field.' }),
  answer: z.string().trim().min(1, { message: 'Required field.' }),
  category: z.string().trim().optional().or(z.literal('')),
});

export type CreateFaqItemInput = z.infer<typeof CreateFaqItemSchema>;

export const UpdateFaqItemSchema = CreateFaqItemSchema.extend({
  id: z.string().uuid(),
});

export type UpdateFaqItemInput = z.infer<typeof UpdateFaqItemSchema>;
