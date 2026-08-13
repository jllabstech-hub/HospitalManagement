'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateFaqItemSchema, CreateFaqItemInput, UpdateFaqItemSchema, UpdateFaqItemInput } from './schemas';
import type { ActionResult } from '@/types/server-action';

export async function createFaqItemAction(rawInput: CreateFaqItemInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateFaqItemSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const data = parsed.data as any;
    // Generate slug from title, name, or question if it exists
    if (data.title && !data.slug) data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.name && !data.slug) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await prisma.faqItem.create({
      data: {
        ...data,
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/faqs');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateFaqItemAction(rawInput: UpdateFaqItemInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateFaqItemSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data as any;
    if (data.title && !data.slug) data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (data.name && !data.slug) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await prisma.faqItem.update({
      where: { id, tenantId: admin.tenantId },
      data,
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/faqs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteFaqItemAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.faqItem.delete({
      where: { id, tenantId: admin.tenantId },
    });
    revalidateTag('public-catalog');
    revalidatePath('/admin/faqs');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete record.' };
  }
}
