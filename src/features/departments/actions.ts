'use server';

import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { DomainError } from '@/server/errors/domain-error';
import {
  CreateDepartmentSchema,
  CreateDepartmentInput,
  UpdateDepartmentSchema,
  UpdateDepartmentInput,
} from './schemas';
import { revalidatePath } from 'next/cache';

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

/**
 * Creates a new medical department.
 * SERVER AUTHORIZATION: Requires ADMIN role.
 */
export async function createDepartmentAction(
  rawInput: CreateDepartmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const parsed = CreateDepartmentSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid department data.';
      return { success: false, error: issue };
    }

    const { name, description } = parsed.data;
    const normalizedName = name.trim();

    // Check case-insensitive duplicate department name
    const existing = await prisma.department.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' },
      },
    });

    if (existing) {
      return { success: false, error: 'This department already exists.' };
    }

    const department = await prisma.department.create({
      data: {
        name: normalizedName,
        description: description || null,
        isActive: true,
      },
    });

    safeRevalidate('/admin/departments');
    safeRevalidate('/admin/dashboard');
    return { success: true, data: { id: department.id } };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Create department error:', error);
    return { success: false, error: 'An error occurred while creating the department.' };
  }
}

/**
 * Updates an existing medical department.
 * SERVER AUTHORIZATION: Requires ADMIN role.
 */
export async function updateDepartmentAction(
  rawInput: UpdateDepartmentInput
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = UpdateDepartmentSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid department data.';
      return { success: false, error: issue };
    }

    const { id, name, description } = parsed.data;
    const normalizedName = name.trim();

    const existingDept = await prisma.department.findUnique({ where: { id } });
    if (!existingDept) {
      return { success: false, error: 'Department not found.' };
    }

    // Check if another department uses this name
    const duplicate = await prisma.department.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' },
        id: { not: id },
      },
    });

    if (duplicate) {
      return { success: false, error: 'Another department is already using this name.' };
    }

    await prisma.department.update({
      where: { id },
      data: {
        name: normalizedName,
        description: description || null,
      },
    });

    safeRevalidate('/admin/departments');
    safeRevalidate('/admin/dashboard');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Update department error:', error);
    return { success: false, error: 'An error occurred while updating the department.' };
  }
}

/**
 * Toggles department active status (Soft Deactivation / Reactivation).
 * SERVER AUTHORIZATION: Requires ADMIN role.
 */
export async function toggleDepartmentStatusAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid department ID.' };
    }

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Department not found.' };
    }

    await prisma.department.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    safeRevalidate('/admin/departments');
    safeRevalidate('/admin/dashboard');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Toggle department status error:', error);
    return { success: false, error: 'An error occurred while changing department status.' };
  }
}
