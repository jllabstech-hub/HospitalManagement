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
      .min(6, { message: 'Password must be at least 6 characters long.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const PhoneInputSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{10,15}$/, { message: 'Please enter a valid 10-digit phone number.' }),
});

export type PhoneInput = z.infer<typeof PhoneInputSchema>;

export const OtpInputSchema = z.object({
  phoneNumber: z.string().trim(),
  otp: z
    .string()
    .trim()
    .length(6, { message: 'OTP must be exactly 6 digits.' }),
});

export type OtpInput = z.infer<typeof OtpInputSchema>;

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

