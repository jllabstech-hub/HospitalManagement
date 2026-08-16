'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateNewsArticleSchema, CreateNewsArticleInput, UpdateNewsArticleSchema, UpdateNewsArticleInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';
import { sanitizeCmsImageUrl } from '@/features/cms-images/urls';

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createNewsArticleAction(rawInput: CreateNewsArticleInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateNewsArticleSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.newsArticle.create({
      data: {
        title: parsed.data.title,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        coverImageUrl: sanitizeCmsImageUrl(parsed.data.coverImageUrl),
        slug: slugify(parsed.data.title),
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/news');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateNewsArticleAction(rawInput: UpdateNewsArticleInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateNewsArticleSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.newsArticle.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        title: data.title,
        excerpt: data.excerpt || null,
        content: data.content,
        coverImageUrl: sanitizeCmsImageUrl(data.coverImageUrl),
        slug: slugify(data.title),
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/news');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteNewsArticleAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.newsArticle.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/news');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
