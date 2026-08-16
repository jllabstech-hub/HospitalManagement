import sharp from 'sharp';
import { prisma } from '@/server/db/client';
import { DomainError } from '@/server/errors/domain-error';
import { validateImageUpload } from '@/server/security/media';
import { getStorageProvider } from '@/server/storage';
import type { ImageAspectRatio } from '@/server/ai/image-generation';

const TARGET_SIZE: Record<ImageAspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1600, height: 900 },
  '1:1': { width: 1200, height: 1200 },
};

export async function optimizeGeneratedImage(
  bytes: Buffer,
  declaredMime: string,
  aspectRatio: ImageAspectRatio
): Promise<{ buffer: Buffer; mimeType: string; width: number; height: number; filename: string }> {
  const target = TARGET_SIZE[aspectRatio];
  try {
    const pipeline = sharp(bytes).rotate();
    const output = await pipeline
      .resize(target.width, target.height, { fit: 'cover', position: 'attention', withoutEnlargement: false })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    const validated = validateImageUpload({
      originalName: 'generated.webp',
      declaredMime: 'image/webp',
      size: output.data.length,
      buffer: output.data,
    });

    return {
      buffer: output.data,
      mimeType: validated.mimeType,
      width: output.info.width,
      height: output.info.height,
      filename: validated.filename,
    };
  } catch (error) {
    if (error instanceof DomainError) throw error;
    const validated = validateImageUpload({
      originalName: declaredMime.includes('png') ? 'generated.png' : declaredMime.includes('webp') ? 'generated.webp' : 'generated.jpg',
      declaredMime,
      size: bytes.length,
      buffer: bytes,
    });
    return {
      buffer: bytes,
      mimeType: validated.mimeType,
      width: validated.width ?? target.width,
      height: validated.height ?? target.height,
      filename: validated.filename,
    };
  }
}

export async function storeGeneratedMediaAsset(input: {
  tenantId: string;
  bytes: Buffer;
  declaredMime: string;
  altText: string;
  aspectRatio: ImageAspectRatio;
}): Promise<{ id: string; url: string; altText: string; width: number | null; height: number | null }> {
  const optimized = await optimizeGeneratedImage(input.bytes, input.declaredMime, input.aspectRatio);
  const storage = getStorageProvider();
  const uploaded = await storage.uploadObject({
    tenantId: input.tenantId,
    filename: optimized.filename,
    buffer: optimized.buffer,
    mimeType: optimized.mimeType,
  });

  const media = await prisma.mediaAsset.create({
    data: {
      url: uploaded.publicUrl,
      storageKey: uploaded.key,
      isPrivate: false,
      altText: input.altText.slice(0, 200),
      type: 'IMAGE',
      width: optimized.width,
      height: optimized.height,
      fileSize: optimized.buffer.length,
      mimeType: optimized.mimeType,
      tenantId: input.tenantId,
    },
    select: { id: true, url: true, altText: true, width: true, height: true },
  });

  return {
    id: media.id,
    url: media.url,
    altText: media.altText ?? input.altText,
    width: media.width,
    height: media.height,
  };
}
