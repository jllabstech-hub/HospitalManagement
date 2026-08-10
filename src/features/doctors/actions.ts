'use server';

import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { hashPassword } from '@/server/security/password';
import { DomainError } from '@/server/errors/domain-error';
import {
  CreateDoctorSchema,
  CreateDoctorInput,
  UpdateDoctorSchema,
  UpdateDoctorInput,
} from './schemas';
import { Role } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { slugify } from '@/lib/slug';

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored outside Next.js request context (e.g., in unit tests)
  }
}

function safeRevalidatePublicDoctorCaches() {
  try {
    revalidateTag('public-doctors');
    revalidateTag('public-departments');
    revalidatePath('/');
    revalidatePath('/patient/doctors');
  } catch {
    // Ignored outside Next.js request context (e.g., in unit tests)
  }
}

/**
 * Creates a new Doctor User + DoctorProfile in an atomic transaction.
 * SERVER AUTHORIZATION: Requires ADMIN role.
 */
export async function createDoctorAction(
  rawInput: CreateDoctorInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const parsed = CreateDoctorSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid doctor data.';
      return { success: false, error: issue };
    }

    const {
      fullName,
      email,
      password,
      departmentId,
      qualification,
      experienceYears,
      phoneNumber,
      bio,
    } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify department exists and is ACTIVE
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return { success: false, error: 'Selected department does not exist.' };
    }

    if (!department.isActive) {
      return {
        success: false,
        error: 'Cannot assign a doctor to an inactive department. Please activate the department first.',
      };
    }

    // 2. Check duplicate email across ALL user roles
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email address already exists in the system.',
      };
    }

    // 3. Hash temporary password
    const passwordHash = await hashPassword(password);

    // 4. Atomic Transaction: Create User (Role.DOCTOR) + DoctorProfile + Default Weekly Availability
    const doctorProfile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: Role.DOCTOR,
          isActive: true,
        },
      });

      const baseSlug = slugify(fullName.trim()) || 'doctor';
      let slug = baseSlug;
      let suffix = 0;
      while (await tx.doctorProfile.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      const profile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          departmentId,
          fullName: fullName.trim(),
          slug,
          publicDisplayName: fullName.trim(),
          publicBio: bio || null,
          phoneNumber: phoneNumber.trim(),
          qualification: qualification.trim(),
          experienceYears,
          bio: bio || null,
        },
      });

      // Seed default weekly availability (Mon - Fri, 09:00 - 17:00, 30-min slots)
      for (let day = 1; day <= 5; day++) {
        await tx.weeklyAvailability.create({
          data: {
            doctorId: profile.id,
            dayOfWeek: day,
            startTime: '09:00:00',
            endTime: '17:00:00',
            slotDurationMinutes: 30,
          },
        });
      }

      return profile;
    });

    safeRevalidate('/admin/doctors');
    safeRevalidate('/admin/dashboard');
    safeRevalidatePublicDoctorCaches();
    return { success: true, data: { id: doctorProfile.id } };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Create doctor error:', error);
    return { success: false, error: 'An error occurred while creating the doctor account.' };
  }
}

/**
 * Updates an existing Doctor Profile.
 * SERVER AUTHORIZATION: Requires ADMIN role.
 */
export async function updateDoctorAction(
  rawInput: UpdateDoctorInput
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = UpdateDoctorSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid doctor data.';
      return { success: false, error: issue };
    }

    const {
      id,
      fullName,
      departmentId,
      qualification,
      experienceYears,
      phoneNumber,
      bio,
    } = parsed.data;

    const existingProfile = await prisma.doctorProfile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    // Verify department exists and is ACTIVE
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return { success: false, error: 'Selected department does not exist.' };
    }

    if (!department.isActive) {
      return {
        success: false,
        error: 'Cannot assign a doctor to an inactive department.',
      };
    }

    await prisma.doctorProfile.update({
      where: { id },
      data: {
        departmentId,
        fullName: fullName.trim(),
        qualification: qualification.trim(),
        experienceYears,
        phoneNumber: phoneNumber.trim(),
        bio: bio || null,
      },
    });

    safeRevalidate('/admin/doctors');
    safeRevalidate('/admin/dashboard');
    safeRevalidatePublicDoctorCaches();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Update doctor error:', error);
    return { success: false, error: 'An error occurred while updating doctor details.' };
  }
}

/**
 * Toggles doctor user active status (Soft Deactivation / Reactivation).
 * SERVER AUTHORIZATION: Requires ADMIN role.
 */
export async function toggleDoctorStatusAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid doctor profile ID.' };
    }

    const profile = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile || !profile.user) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    await prisma.user.update({
      where: { id: profile.userId },
      data: { isActive: !profile.user.isActive },
    });

    safeRevalidate('/admin/doctors');
    safeRevalidate('/admin/dashboard');
    safeRevalidatePublicDoctorCaches();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Toggle doctor status error:', error);
    return { success: false, error: 'An error occurred while changing doctor status.' };
  }
}
