import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Department name must be at least 2 characters.' })
    .max(100, { message: 'Department name must not exceed 100 characters.' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Description must not exceed 500 characters.' })
    .optional()
    .or(z.literal('')),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const UpdateDepartmentSchema = z.object({
  id: z.string().uuid({ message: 'Invalid department ID.' }),
  name: z
    .string()
    .trim()
    .min(2, { message: 'Department name must be at least 2 characters.' })
    .max(100, { message: 'Department name must not exceed 100 characters.' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Description must not exceed 500 characters.' })
    .optional()
    .or(z.literal('')),
});

export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
