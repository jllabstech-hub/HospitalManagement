'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateSuccessStorySchema, CreateSuccessStoryInput, UpdateSuccessStorySchema, UpdateSuccessStoryInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createSuccessStoryAction(rawInput: CreateSuccessStoryInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateSuccessStorySchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.successStory.create({
      data: {
        title: parsed.data.title,
        patientDisplayName: parsed.data.patientDisplayName,
        content: parsed.data.content,
        slug: slugify(parsed.data.title),
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/success-stories');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateSuccessStoryAction(rawInput: UpdateSuccessStoryInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateSuccessStorySchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.successStory.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        title: data.title,
        patientDisplayName: data.patientDisplayName,
        content: data.content,
        slug: slugify(data.title),
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/success-stories');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteSuccessStoryAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.successStory.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/success-stories');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
