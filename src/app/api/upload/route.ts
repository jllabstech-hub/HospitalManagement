import { NextResponse } from 'next/server';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { validateImageUpload, MAX_UPLOAD_BYTES } from '@/server/security/media';
import { DomainError } from '@/server/errors/domain-error';
import { writeAuditLog } from '@/server/security/audit';
import { logger } from '@/lib/logger';
import { getStorageProvider } from '@/server/storage';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = (formData.get('altText') as string | null) ?? '';
    const caption = (formData.get('caption') as string | null) ?? '';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 5MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validated = validateImageUpload({
      originalName: file.name,
      declaredMime: file.type,
      size: file.size,
      buffer,
    });

    const storage = getStorageProvider();
    const uploadResult = await storage.uploadObject({
      tenantId: admin.tenantId,
      filename: validated.filename,
      buffer,
      mimeType: validated.mimeType,
    });

    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        url: uploadResult.publicUrl,
        altText: altText.trim().slice(0, 200) || validated.filename,
        caption: caption.trim().slice(0, 500) || null,
        type: 'IMAGE',
        width: validated.width,
        height: validated.height,
        fileSize: file.size,
        mimeType: validated.mimeType,
        storageKey: uploadResult.key,
        isPrivate: false,
        tenantId: admin.tenantId,
      },
    });

    await writeAuditLog({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: 'media.upload',
      entityType: 'MediaAsset',
      entityId: mediaAsset.id,
    });

    return NextResponse.json({
      success: true,
      media: mediaAsset,
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 400 });
    }
    logger.error({ event: 'media.upload_failed' }, 'Media upload failed');
    return NextResponse.json({ error: 'Failed to process media upload.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    const mediaAssets = await prisma.mediaAsset.findMany({
      where: { tenantId: admin.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ media: mediaAssets });
  } catch {
    logger.error({ event: 'media.list_failed' }, 'Failed to list media');
    return NextResponse.json({ error: 'Failed to fetch media assets.' }, { status: 500 });
  }
}
