'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import {
  CreateLeadershipSchema,
  CreateLeadershipInput,
  UpdateLeadershipSchema,
  UpdateLeadershipInput,
} from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createLeadershipAction(rawInput: CreateLeadershipInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateLeadershipSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.leadershipMember.create({
      data: {
        name: parsed.data.name,
        designation: parsed.data.designation,
        shortBio: parsed.data.shortBio || null,
        slug: slugify(parsed.data.name),
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/leadership');
    revalidatePath('/about/leadership');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A leader with this name already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateLeadershipAction(rawInput: UpdateLeadershipInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateLeadershipSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.leadershipMember.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        name: data.name,
        designation: data.designation,
        shortBio: data.shortBio || null,
        slug: slugify(data.name),
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/leadership');
    revalidatePath('/about/leadership');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteLeadershipAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.leadershipMember.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/leadership');
    revalidatePath('/about/leadership');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
