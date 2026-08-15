'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import {
  CreateFacilitySchema,
  CreateFacilityInput,
  UpdateFacilitySchema,
  UpdateFacilityInput,
} from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createFacilityAction(rawInput: CreateFacilityInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateFacilitySchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.facility.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category || null,
        description: parsed.data.description || null,
        slug: slugify(parsed.data.name),
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/facilities');
    revalidatePath('/about/facilities');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A facility with this name already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateFacilityAction(rawInput: UpdateFacilityInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateFacilitySchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.facility.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        name: data.name,
        category: data.category || null,
        description: data.description || null,
        slug: slugify(data.name),
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/facilities');
    revalidatePath('/about/facilities');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteFacilityAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.facility.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/facilities');
    revalidatePath('/about/facilities');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
