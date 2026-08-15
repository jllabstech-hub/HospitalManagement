'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateServiceSchema, CreateServiceInput, UpdateServiceSchema, UpdateServiceInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';

export async function createServiceAction(rawInput: CreateServiceInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateServiceSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.hospitalService.create({
      data: {
        ...parsed.data,
        slug,
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this name already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateServiceAction(rawInput: UpdateServiceInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateServiceSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const updated = await prisma.hospitalService.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: { ...data, slug },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/services');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.hospitalService.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    revalidateTag('public-catalog');
    revalidatePath('/admin/services');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
