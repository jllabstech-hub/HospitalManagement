import { z } from 'zod';

export const CreateServiceSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters.' }),
  shortDescription: z.string().trim().optional().or(z.literal('')),
  fullDescription: z.string().trim().optional().or(z.literal('')),
});

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = CreateServiceSchema.extend({
  id: z.string().uuid(),
});

export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
