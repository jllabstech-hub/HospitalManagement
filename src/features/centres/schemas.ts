import { z } from 'zod';

export const CreateCentreSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters.' }),
  shortDescription: z.string().trim().optional().or(z.literal('')),
  clinicalFocus: z.string().trim().optional().or(z.literal('')),
  heroImageUrl: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type CreateCentreInput = z.infer<typeof CreateCentreSchema>;

export const UpdateCentreSchema = CreateCentreSchema.extend({
  id: z.string().uuid(),
});

export type UpdateCentreInput = z.infer<typeof UpdateCentreSchema>;
