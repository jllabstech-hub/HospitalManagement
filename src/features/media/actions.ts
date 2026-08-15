'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { writeAuditLog } from '@/server/security/audit';
import { getStorageProvider } from '@/server/storage';

export type ActionResult = { success: true } | { success: false; error: string };

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored outside Next.js request context
  }
}

async function deleteStorageObjectIdempotent(storageKey: string | null | undefined): Promise<void> {
  if (!storageKey) return;
  try {
    await getStorageProvider().deleteObject(storageKey);
  } catch {
    // Missing objects and provider errors are treated as success so the DB
    // metadata can still be removed without leaving a zombie admin record.
  }
}

export async function deleteMediaAssetAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const asset = await prisma.mediaAsset.findFirst({
      where: { id, tenantId: admin.tenantId },
      select: { id: true, storageKey: true },
    });
    if (!asset) {
      return { success: false, error: 'Media asset not found.' };
    }

    await deleteStorageObjectIdempotent(asset.storageKey);

    const deleted = await prisma.mediaAsset.deleteMany({
      where: {
        id: asset.id,
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
    safeRevalidate('/admin/media');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete media asset:', error);
    return { success: false, error: 'Failed to delete media asset.' };
  }
}
