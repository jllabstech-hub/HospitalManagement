'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateCentreSchema, CreateCentreInput, UpdateCentreSchema, UpdateCentreInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';
import { sanitizeCmsImageUrl } from '@/features/cms-images/urls';

export async function createCentreAction(rawInput: CreateCentreInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateCentreSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { heroImageUrl, ...rest } = parsed.data;
    await prisma.centreOfExcellence.create({
      data: {
        ...rest,
        heroImageUrl: sanitizeCmsImageUrl(heroImageUrl),
        slug,
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/centres');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this name already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateCentreAction(rawInput: UpdateCentreInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateCentreSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, heroImageUrl, ...data } = parsed.data;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const updated = await prisma.centreOfExcellence.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: { ...data, heroImageUrl: sanitizeCmsImageUrl(heroImageUrl), slug },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/centres');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteCentreAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.centreOfExcellence.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    revalidateTag('public-catalog');
    revalidatePath('/admin/centres');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
