'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { writeAuditLog } from '@/server/security/audit';

export type ActionResult = { success: true } | { success: false; error: string };

export async function deleteMediaAssetAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const deleted = await prisma.mediaAsset.deleteMany({
      where: {
        id,
        tenantId: admin.tenantId,
      },
    });
    if (deleted.count !== 1) {
      return { success: false, error: 'Media asset not found.' };
    }
    await writeAuditLog({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: 'media.delete',
      entityType: 'MediaAsset',
      entityId: id,
    });
    revalidatePath('/admin/media');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete media asset:', error);
    return { success: false, error: 'Failed to delete media asset.' };
  }
}
