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

function safeRevalidatePublicDepartmentCaches() {
  try {
    revalidateTag('public-departments');
    revalidatePath('/');
    revalidatePath('/patient/doctors');
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
    const admin = await requireAdmin();

    const parsed = CreateDepartmentSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid department data.';
      return { success: false, error: issue };
    }

    const { name, description } = parsed.data;
    const normalizedName = name.trim();
    const baseSlug = slugify(normalizedName) || 'department';
    let slug = baseSlug;

    let suffix = 0;
    while (await prisma.department.findFirst({ where: { slug, tenantId: admin.tenantId } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    // Check case-insensitive duplicate department name for the active tenant
    const existing = await prisma.department.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' },
        tenantId: admin.tenantId,
      },
    });

    if (existing) {
      return { success: false, error: 'This department already exists.' };
    }

    const department = await prisma.department.create({
      data: {
        name: normalizedName,
        slug,
        description: description || null,
        shortDescription: description || null,
        imageUrl: parsed.data.imageUrl?.trim() || null,
        seoTitle: parsed.data.seoTitle?.trim() || null,
        seoDescription: parsed.data.seoDescription?.trim() || null,
        isActive: true,
        tenantId: admin.tenantId,
      },
    });

    safeRevalidate('/admin/departments');
    safeRevalidate('/admin/dashboard');
    safeRevalidatePublicDepartmentCaches();
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
    const admin = await requireAdmin();

    const parsed = UpdateDepartmentSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid department data.';
      return { success: false, error: issue };
    }

    const { id, name, description } = parsed.data;
    const normalizedName = name.trim();


    const dept = await prisma.department.findFirst({ where: { id, tenantId: admin.tenantId } });
    if (!dept) {
      return { success: false, error: 'Department not found.' };
    }

    // Check if another department uses this name in the same tenant
    const duplicate = await prisma.department.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' },
        id: { not: id },
        tenantId: admin.tenantId,
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
        imageUrl: parsed.data.imageUrl?.trim() || null,
        seoTitle: parsed.data.seoTitle?.trim() || null,
        seoDescription: parsed.data.seoDescription?.trim() || null,
      },
    });

    safeRevalidate('/admin/departments');
    safeRevalidate('/admin/dashboard');
    safeRevalidatePublicDepartmentCaches();
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
    const admin = await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid department ID.' };
    }

    const existing = await prisma.department.findFirst({ where: { id, tenantId: admin.tenantId } });
    if (!existing) {
      return { success: false, error: 'Department not found.' };
    }

    await prisma.department.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    safeRevalidate('/admin/departments');
    safeRevalidate('/admin/dashboard');
    safeRevalidatePublicDepartmentCaches();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Toggle department status error:', error);
    return { success: false, error: 'An error occurred while changing department status.' };
  }
}
