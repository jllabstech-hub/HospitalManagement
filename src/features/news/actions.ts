'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateNewsArticleSchema, CreateNewsArticleInput, UpdateNewsArticleSchema, UpdateNewsArticleInput } from './schemas';
import type { ActionResult } from '@/types/server-action';

export async function createNewsArticleAction(rawInput: CreateNewsArticleInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateNewsArticleSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const data = parsed.data as any;
    // Generate slug from title, name, or question if it exists
    if (data.title && !data.slug) data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.name && !data.slug) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await prisma.newsArticle.create({
      data: {
        ...data,
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/news');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateNewsArticleAction(rawInput: UpdateNewsArticleInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateNewsArticleSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data as any;
    if (data.title && !data.slug) data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.name && !data.slug) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await prisma.newsArticle.update({
      where: { id, tenantId: admin.tenantId },
      data,
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/news');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteNewsArticleAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.newsArticle.delete({
      where: { id, tenantId: admin.tenantId },
    });
    revalidateTag('public-catalog');
    revalidatePath('/admin/news');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete record.' };
  }
}
