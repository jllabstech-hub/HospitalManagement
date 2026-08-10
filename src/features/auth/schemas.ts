import { z } from 'zod';

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, { message: 'Full name must be at least 2 characters.' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: 'Please enter a valid email address.' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
