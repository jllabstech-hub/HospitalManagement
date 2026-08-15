'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { CreateFaqItemSchema, CreateFaqItemInput, UpdateFaqItemSchema, UpdateFaqItemInput } from './schemas';
import type { ActionResult } from '@/types/server-action';
import { prismaErrorCode } from '@/server/db/tenant-ops';

export async function createFaqItemAction(rawInput: CreateFaqItemInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = CreateFaqItemSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    await prisma.faqItem.create({
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        category: parsed.data.category || null,
        tenantId: admin.tenantId,
      },
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/faqs');
    return { success: true };
  } catch (error: unknown) {
    if (prismaErrorCode(error) === 'P2002') return { success: false, error: 'A record with this identifier already exists.' };
    return { success: false, error: 'Failed to create record.' };
  }
}

export async function updateFaqItemAction(rawInput: UpdateFaqItemInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = UpdateFaqItemSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { id, ...data } = parsed.data;
    const updated = await prisma.faqItem.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || null,
      },
    });
    if (updated.count !== 1) return { success: false, error: 'Record not found.' };

    revalidateTag('public-catalog');
    revalidatePath('/admin/faqs');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update record.' };
  }
}

export async function deleteFaqItemAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.faqItem.deleteMany({
      where: { id, tenantId: admin.tenantId },
    });
    if (deleted.count !== 1) return { success: false, error: 'Record not found.' };
    revalidateTag('public-catalog');
    revalidatePath('/admin/faqs');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete record.' };
  }
}
