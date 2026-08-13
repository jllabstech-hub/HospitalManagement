import { z } from 'zod';

export const CreatePatientResourceSchema = z.object({
  title: z.string().trim().min(1, { message: 'Required field.' }),
  description: z.string().trim().optional().or(z.literal('')),
});

export type CreatePatientResourceInput = z.infer<typeof CreatePatientResourceSchema>;

export const UpdatePatientResourceSchema = CreatePatientResourceSchema.extend({
  id: z.string().uuid(),
});

export type UpdatePatientResourceInput = z.infer<typeof UpdatePatientResourceSchema>;
