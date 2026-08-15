'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { InternationalPageSchema, InternationalPageInput } from './schemas';
import type { ActionResult } from '@/types/server-action';

export async function upsertInternationalPageAction(
  rawInput: InternationalPageInput
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = InternationalPageSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const data = {
      title: parsed.data.title,
      introduction: parsed.data.introduction || null,
      howToRequest: parsed.data.howToRequest || null,
      secondOpinion: parsed.data.secondOpinion || null,
      requiredDocuments: parsed.data.requiredDocuments || null,
      travelInformation: parsed.data.travelInformation || null,
      accommodationInfo: parsed.data.accommodationInfo || null,
      coordinatorContact: parsed.data.coordinatorContact || null,
    };

    await prisma.internationalPageContent.upsert({
      where: { tenantId: admin.tenantId },
      create: { ...data, tenantId: admin.tenantId },
      update: data,
    });

    revalidateTag('public-catalog');
    revalidatePath('/admin/international');
    revalidatePath('/international-patients');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save international page content.' };
  }
}
