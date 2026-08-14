'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
export type ActionResult = { success: true } | { success: false; error: string };

export async function deleteMediaAssetAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    await prisma.mediaAsset.delete({
      where: {
        id,
      },
    });
    revalidatePath('/admin/media');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete media asset:', error);
    return { success: false, error: 'Failed to delete media asset.' };
  }
}
