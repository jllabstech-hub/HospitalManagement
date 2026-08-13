import { z } from 'zod';

export const CreateSpecialitySchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters.' }),
  shortDescription: z.string().trim().optional().or(z.literal('')),
  fullDescription: z.string().trim().optional().or(z.literal('')),
  seoTitle: z.string().trim().optional().or(z.literal('')),
});

export type CreateSpecialityInput = z.infer<typeof CreateSpecialitySchema>;

export const UpdateSpecialitySchema = CreateSpecialitySchema.extend({
  id: z.string().uuid(),
});

export type UpdateSpecialityInput = z.infer<typeof UpdateSpecialitySchema>;
