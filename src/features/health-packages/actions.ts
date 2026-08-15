'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateHealthPackageSchema, CreateHealthPackageInput, UpdateHealthPackageSchema, UpdateHealthPackageInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createHealthPackageAction(rawInput: CreateHealthPackageInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateHealthPackageSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.healthPackage.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.shortDescription || null,
        slug: slugify(parsed.data.name),
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/health-packages');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateHealthPackageAction(rawInput: UpdateHealthPackageInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateHealthPackageSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.healthPackage.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        name: data.name,
        description: data.shortDescription || null,
        slug: slugify(data.name),
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/health-packages');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteHealthPackageAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.healthPackage.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/health-packages');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
