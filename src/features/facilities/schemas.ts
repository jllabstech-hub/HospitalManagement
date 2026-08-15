import { z } from 'zod';

export const CreateFacilitySchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters.' }),
  category: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().optional().or(z.literal('')),
});

export type CreateFacilityInput = z.infer<typeof CreateFacilitySchema>;

export const UpdateFacilitySchema = CreateFacilitySchema.extend({
  id: z.string().uuid(),
});

export type UpdateFacilityInput = z.infer<typeof UpdateFacilitySchema>;
