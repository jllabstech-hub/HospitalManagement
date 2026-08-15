'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreatePatientResourceSchema, CreatePatientResourceInput, UpdatePatientResourceSchema, UpdatePatientResourceInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createPatientResourceAction(rawInput: CreatePatientResourceInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreatePatientResourceSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.patientResource.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        slug: slugify(parsed.data.title),
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/patient-resources');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updatePatientResourceAction(rawInput: UpdatePatientResourceInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdatePatientResourceSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.patientResource.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        title: data.title,
        description: data.description || null,
        slug: slugify(data.title),
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/patient-resources');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deletePatientResourceAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.patientResource.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/patient-resources');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
