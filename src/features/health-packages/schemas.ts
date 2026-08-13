import { z } from 'zod';

export const CreateHealthPackageSchema = z.object({
  name: z.string().trim().min(1, { message: 'Required field.' }),
  shortDescription: z.string().trim().optional().or(z.literal('')),
});

export type CreateHealthPackageInput = z.infer<typeof CreateHealthPackageSchema>;

export const UpdateHealthPackageSchema = CreateHealthPackageSchema.extend({
  id: z.string().uuid(),
});

export type UpdateHealthPackageInput = z.infer<typeof UpdateHealthPackageSchema>;
