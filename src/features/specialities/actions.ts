'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateSpecialitySchema, CreateSpecialityInput, UpdateSpecialitySchema, UpdateSpecialityInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';
import { sanitizeCmsImageUrl } from '@/features/cms-images/urls';

export async function createSpecialityAction(rawInput: CreateSpecialityInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateSpecialitySchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { imageUrl, ...rest } = parsed.data;
    await prisma.speciality.create({
      data: {
        ...rest,
        imageUrl: sanitizeCmsImageUrl(imageUrl),
        slug,
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/specialities');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this name already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateSpecialityAction(rawInput: UpdateSpecialityInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateSpecialitySchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, imageUrl, ...data } = parsed.data;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const updated = await prisma.speciality.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: { ...data, imageUrl: sanitizeCmsImageUrl(imageUrl), slug },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/specialities');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteSpecialityAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.speciality.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    revalidateTag('public-catalog');
    revalidatePath('/admin/specialities');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
