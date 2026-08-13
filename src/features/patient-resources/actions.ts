'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreatePatientResourceSchema, CreatePatientResourceInput, UpdatePatientResourceSchema, UpdatePatientResourceInput } from './schemas';
import type { ActionResult } from '@/types/server-action';

export async function createPatientResourceAction(rawInput: CreatePatientResourceInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreatePatientResourceSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const data = parsed.data as any;
    // Generate slug from title, name, or question if it exists
    if (data.title && !data.slug) data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.name && !data.slug) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await prisma.patientResource.create({
      data: {
        ...data,
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/patient-resources');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updatePatientResourceAction(rawInput: UpdatePatientResourceInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdatePatientResourceSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data as any;
    if (data.title && !data.slug) data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.name && !data.slug) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await prisma.patientResource.update({
      where: { id, tenantId: admin.tenantId },
      data,
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/patient-resources');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deletePatientResourceAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.patientResource.delete({
      where: { id, tenantId: admin.tenantId },
    });
    revalidateTag('public-catalog');
    revalidatePath('/admin/patient-resources');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete record.' };
  }
}
