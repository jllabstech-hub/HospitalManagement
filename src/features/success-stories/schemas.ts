import { z } from 'zod';

export const CreateSuccessStorySchema = z.object({
  title: z.string().trim().min(1, { message: 'Required field.' }),
  patientDisplayName: z.string().trim().min(1, { message: 'Required field.' }),
  content: z.string().trim().min(1, { message: 'Required field.' }),
});

export type CreateSuccessStoryInput = z.infer<typeof CreateSuccessStorySchema>;

export const UpdateSuccessStorySchema = CreateSuccessStorySchema.extend({
  id: z.string().uuid(),
});

export type UpdateSuccessStoryInput = z.infer<typeof UpdateSuccessStorySchema>;
