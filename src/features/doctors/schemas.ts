import { z } from 'zod';

export const CreateDoctorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Doctor name must be at least 2 characters.' })
    .max(150, { message: 'Doctor name must not exceed 150 characters.' }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(8, { message: 'Temporary password must be at least 8 characters long.' }),
  departmentId: z
    .string()
    .uuid({ message: 'Please select a valid medical department.' }),
  qualification: z
    .string()
    .trim()
    .min(2, { message: 'Qualification must be specified (e.g. MBBS, MD).' }),
  experienceYears: z
    .coerce
    .number()
    .int()
    .min(0, { message: 'Experience years cannot be negative.' }),
  phoneNumber: z
    .string()
    .trim()
    .min(5, { message: 'Phone number must be at least 5 digits.' }),
  bio: z
    .string()
    .trim()
    .max(1000, { message: 'Bio must not exceed 1000 characters.' })
    .optional()
    .or(z.literal('')),
  profileImageUrl: z.string().trim().optional().or(z.literal('')),
});

export type CreateDoctorInput = z.infer<typeof CreateDoctorSchema>;

export const UpdateDoctorSchema = z.object({
  id: z.string().uuid({ message: 'Invalid doctor profile ID.' }),
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Doctor name must be at least 2 characters.' })
    .max(150, { message: 'Doctor name must not exceed 150 characters.' }),
  departmentId: z
    .string()
    .uuid({ message: 'Please select a valid medical department.' }),
  qualification: z
    .string()
    .trim()
    .min(2, { message: 'Qualification must be specified.' }),
  experienceYears: z
    .coerce
    .number()
    .int()
    .min(0, { message: 'Experience years cannot be negative.' }),
  phoneNumber: z
    .string()
    .trim()
    .min(5, { message: 'Phone number must be at least 5 digits.' }),
  bio: z
    .string()
    .trim()
    .max(1000, { message: 'Bio must not exceed 1000 characters.' })
    .optional()
    .or(z.literal('')),
  profileImageUrl: z.string().trim().optional().or(z.literal('')),
});

export type UpdateDoctorInput = z.infer<typeof UpdateDoctorSchema>;
