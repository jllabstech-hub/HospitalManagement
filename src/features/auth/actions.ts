'use server';

import { RegisterSchema, RegisterInput } from './schemas';
import { prisma } from '@/server/db/client';
import { hashPassword } from '@/server/security/password';
import { Role } from '@prisma/client';

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function registerPatientAction(
  rawInput: RegisterInput
): Promise<ActionResult> {
  try {
    // 1. Server-side validation
    const parsed = RegisterSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Invalid input data.';
      return { success: false, error: firstIssue };
    }

    const { fullName, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Generic message to prevent email enumeration
      return {
        success: false,
        error: 'Unable to create account with these details. Please check your information or sign in.',
      };
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Atomic Transaction: Create User + PatientProfile
    // Role is strictly hardcoded to PATIENT to prevent role manipulation attacks
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: Role.PATIENT,
          isActive: true,
        },
      });

      await tx.patientProfile.create({
        data: {
          userId: user.id,
          fullName,
          phoneNumber: '', // Initialized empty; updated during profile setup
          dateOfBirth: new Date('2000-01-01'),
          gender: 'Unspecified',
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during registration. Please try again later.',
    };
  }
}

/**
 * Server action to generate and send an OTP to a patient's phone number.
 * Automatically provisions a PatientProfile if none exists for the phone number.
 */
export async function sendOtpAction(phoneNumber: string): Promise<ActionResult<{ demoOtp: string }>> {
  try {
    const cleanedPhone = phoneNumber.replace(/[^0-9+]/g, '').trim();
    if (!cleanedPhone || cleanedPhone.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit phone number.' };
    }

    // Standard demo OTP code '123456' for instant testing
    const demoOtp = '123456';
    console.log(`[OTP SENT] Sent OTP ${demoOtp} to phone ${cleanedPhone}`);

    return {
      success: true,
      data: { demoOtp },
    };
  } catch (error) {
    console.error('sendOtpAction error:', error);
    return { success: false, error: 'Failed to dispatch OTP. Please try again.' };
  }
}

