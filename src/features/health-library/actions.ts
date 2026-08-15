'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateHealthArticleSchema, CreateHealthArticleInput, UpdateHealthArticleSchema, UpdateHealthArticleInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';
import { writeAuditLog } from '@/server/security/audit';

function slugFromTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createHealthArticleAction(rawInput: CreateHealthArticleInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateHealthArticleSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.healthArticle.create({
      data: {
        title: parsed.data.title,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        slug: slugFromTitle(parsed.data.title),
        tenantId: admin.tenantId,
      },
    });

    await writeAuditLog({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: 'cms.mutate',
      entityType: 'HealthArticle',
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/health-library');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateHealthArticleAction(rawInput: UpdateHealthArticleInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateHealthArticleSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.healthArticle.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        title: data.title,
        excerpt: data.excerpt || null,
        content: data.content,
        slug: slugFromTitle(data.title),
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/health-library');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteHealthArticleAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.healthArticle.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/health-library');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
