'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { writeAuditLog } from '@/server/security/audit';
import { DomainError } from '@/server/errors/domain-error';
import {
  buildCmsImageAltText,
  buildCmsImagePrompt,
  getImageGenerationProvider,
} from '@/server/ai/image-generation';
import { type ImageStyle } from '@/server/ai/image-generation/types';
import type { ActionResult } from '@/types/server-action';
import {
  CMS_IMAGE_TARGETS,
  attachImageUrlToRecord,
  listCmsImageRecords,
  loadCmsImageRecord,
} from './registry';
import { storeGeneratedMediaAsset } from './store';
import { isCatalogImageUrl, matchStockImage } from './stock-catalog';
import { isDisplayableCmsImageUrl } from './urls';
import type { CmsImageContentType, GeneratedCmsImageResult } from './types';

const contentTypeSchema = z.enum([
  'SPECIALITY',
  'DEPARTMENT',
  'CENTRE',
  'SERVICE',
  'HEALTH_PACKAGE',
  'FACILITY',
  'ARTICLE',
  'NEWS',
  'HOSPITAL_HERO',
]);

const styleSchema = z.enum([
  'medical-editorial',
  'clinical-illustration',
  'modern-hospital',
  'abstract-medical',
]);

const generateSchema = z.object({
  contentType: contentTypeSchema,
  recordId: z.string().uuid(),
  style: styleSchema.optional(),
});

const attachSchema = z.object({
  contentType: contentTypeSchema,
  recordId: z.string().uuid(),
  mediaId: z.string().uuid(),
  replaceExisting: z.boolean().optional(),
});

const bulkSchema = z.object({
  contentType: contentTypeSchema,
  recordIds: z.array(z.string().uuid()).max(40),
  missingOnly: z.boolean().optional(),
  style: styleSchema.optional(),
});

const inFlight = new Set<string>();

function userError(error: unknown): string {
  if (error instanceof DomainError) {
    return error.userMessage || error.message;
  }
  return 'Unable to generate image. Please try again.';
}

function lockKey(tenantId: string, contentType: string, recordId: string): string {
  return `${tenantId}:${contentType}:${recordId}`;
}

async function withGenerationLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) {
    throw new DomainError(
      'CONFLICT',
      'Image generation is already running for this record.',
      'Image generation is already running. Please wait.',
      409
    );
  }
  inFlight.add(key);
  try {
    return await work();
  } finally {
    inFlight.delete(key);
  }
}

function revalidateCmsImage(contentType: CmsImageContentType, slug?: string | null) {
  const target = CMS_IMAGE_TARGETS[contentType];
  try {
    revalidateTag('public-catalog');
    revalidatePath(target.adminPath);
    revalidatePath('/admin/media');
    if (contentType === 'HOSPITAL_HERO') {
      revalidatePath('/');
    } else if (slug) {
      revalidatePath(`${target.publicPathPrefix}/${slug}`);
      revalidatePath(target.publicPathPrefix);
    } else {
      revalidatePath(target.publicPathPrefix);
    }
  } catch {
    // Ignored outside Next.js request context
  }
}

async function generateAndStore(input: {
  tenantId: string;
  actorUserId: string;
  contentType: CmsImageContentType;
  recordId: string;
  style?: ImageStyle;
}): Promise<GeneratedCmsImageResult> {
  const record = await loadCmsImageRecord(input.contentType, input.recordId, input.tenantId);
  if (!record) {
    throw new DomainError('NOT_FOUND', 'CMS record not found.', undefined, 404);
  }

  const target = CMS_IMAGE_TARGETS[input.contentType];
  const style = input.style ?? 'medical-editorial';
  const prompt = buildCmsImagePrompt({
    type: target.promptType,
    title: record.title,
    description: record.description,
    services: record.relatedNames,
    style,
    aspectRatio: target.aspectRatio,
  });
  const altText = buildCmsImageAltText({ type: target.promptType, title: record.title });

  const generated = await getImageGenerationProvider().generateImage({
    prompt,
    aspectRatio: target.aspectRatio,
    style,
  });

  const media = await storeGeneratedMediaAsset({
    tenantId: input.tenantId,
    bytes: generated.bytes,
    declaredMime: generated.mimeType,
    altText,
    aspectRatio: target.aspectRatio,
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: 'media.generate',
    entityType: 'MediaAsset',
    entityId: media.id,
    after: {
      contentType: input.contentType,
      recordId: record.id,
      mediaId: media.id,
    },
  });

  return {
    mediaId: media.id,
    url: media.url,
    altText: media.altText,
    width: media.width,
    height: media.height,
  };
}

export async function generateCmsImageAction(
  rawInput: unknown
): Promise<ActionResult<GeneratedCmsImageResult & { currentImageUrl: string | null; title: string }>> {
  try {
    const admin = await requireAdmin();
    const parsed = generateSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' };

    const record = await loadCmsImageRecord(parsed.data.contentType, parsed.data.recordId, admin.tenantId);
    if (!record) return { success: false, error: 'Record not found.' };

    const generated = await withGenerationLock(
      lockKey(admin.tenantId, parsed.data.contentType, parsed.data.recordId),
      () =>
        generateAndStore({
          tenantId: admin.tenantId,
          actorUserId: admin.id,
          contentType: parsed.data.contentType,
          recordId: parsed.data.recordId,
          style: parsed.data.style,
        })
    );

    return {
      success: true,
      data: {
        ...generated,
        currentImageUrl: record.imageUrl,
        title: record.title,
      },
    };
  } catch (error) {
    return { success: false, error: userError(error) };
  }
}

export async function attachCmsImageAction(rawInput: unknown): Promise<ActionResult<{ url: string }>> {
  try {
    const admin = await requireAdmin();
    const parsed = attachSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' };

    const media = await prisma.mediaAsset.findFirst({
      where: { id: parsed.data.mediaId, tenantId: admin.tenantId },
      select: { id: true, url: true },
    });
    if (!media) return { success: false, error: 'Media asset not found.' };

    const record = await loadCmsImageRecord(parsed.data.contentType, parsed.data.recordId, admin.tenantId);
    if (!record) return { success: false, error: 'Record not found.' };

    if (record.imageUrl && record.imageUrl !== media.url && parsed.data.replaceExisting === false) {
      return { success: true, data: { url: record.imageUrl } };
    }

    const attached = await attachImageUrlToRecord({
      contentType: parsed.data.contentType,
      recordId: record.id,
      tenantId: admin.tenantId,
      url: media.url,
    });
    if (!attached) return { success: false, error: 'Failed to attach image to the CMS record.' };

    await writeAuditLog({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: record.imageUrl && record.imageUrl !== media.url ? 'media.replace' : 'media.attach',
      entityType: parsed.data.contentType,
      entityId: record.id,
      before: record.imageUrl ? { imageUrl: record.imageUrl } : null,
      after: { imageUrl: media.url, mediaId: media.id },
    });

    revalidateCmsImage(parsed.data.contentType, record.slug);
    return { success: true, data: { url: media.url } };
  } catch (error) {
    return { success: false, error: userError(error) };
  }
}

export async function discardGeneratedCmsImageAction(mediaId: string): Promise<ActionResult> {
  const { deleteMediaAssetAction } = await import('@/features/media/actions');
  return deleteMediaAssetAction(mediaId);
}

export async function generateMissingCmsImagesAction(
  rawInput: unknown
): Promise<ActionResult<{ results: Array<{ recordId: string; title: string; status: 'generated' | 'skipped' | 'failed'; error?: string }> }>> {
  try {
    const admin = await requireAdmin();
    const parsed = bulkSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' };

    const records = await listCmsImageRecords(parsed.data.contentType, admin.tenantId);
    const selected = new Set(parsed.data.recordIds);
    const targets = records.filter((record) => selected.has(record.id) && (parsed.data.missingOnly ? !record.imageUrl : true));

    const results: Array<{ recordId: string; title: string; status: 'generated' | 'skipped' | 'failed'; error?: string }> = [];

    for (const record of targets) {
      if (record.imageUrl && parsed.data.missingOnly) {
        results.push({ recordId: record.id, title: record.title, status: 'skipped' });
        continue;
      }
      if (record.imageUrl && !parsed.data.missingOnly) {
        results.push({ recordId: record.id, title: record.title, status: 'skipped' });
        continue;
      }
      try {
        const generated = await withGenerationLock(
          lockKey(admin.tenantId, parsed.data.contentType, record.id),
          () =>
            generateAndStore({
              tenantId: admin.tenantId,
              actorUserId: admin.id,
              contentType: parsed.data.contentType,
              recordId: record.id,
              style: parsed.data.style,
            })
        );
        const attached = await attachImageUrlToRecord({
          contentType: parsed.data.contentType,
          recordId: record.id,
          tenantId: admin.tenantId,
          url: generated.url,
        });
        if (!attached) {
          results.push({
            recordId: record.id,
            title: record.title,
            status: 'failed',
            error: 'Image was saved to the media library but could not be attached. Retry Use Image from the record.',
          });
          continue;
        }
        await writeAuditLog({
          tenantId: admin.tenantId,
          actorUserId: admin.id,
          action: 'media.attach',
          entityType: parsed.data.contentType,
          entityId: record.id,
          after: { imageUrl: generated.url, mediaId: generated.mediaId },
        });
        revalidateCmsImage(parsed.data.contentType, record.slug);
        results.push({ recordId: record.id, title: record.title, status: 'generated' });
      } catch (error) {
        results.push({ recordId: record.id, title: record.title, status: 'failed', error: userError(error) });
      }
    }

    return { success: true, data: { results } };
  } catch (error) {
    return { success: false, error: userError(error) };
  }
}

const attachStockSchema = z.object({
  contentType: contentTypeSchema,
  recordId: z.string().uuid(),
  url: z.string().url().max(2000),
});

const fillMissingSchema = z.object({
  contentType: contentTypeSchema,
  recordIds: z.array(z.string().uuid()).max(80).optional(),
});

export async function attachStockImageAction(
  rawInput: unknown
): Promise<ActionResult<{ url: string }>> {
  try {
    const admin = await requireAdmin();
    const parsed = attachStockSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' };
    if (!isCatalogImageUrl(parsed.data.url) && !isDisplayableCmsImageUrl(parsed.data.url)) {
      return { success: false, error: 'That image cannot be used on public pages.' };
    }

    const record = await loadCmsImageRecord(parsed.data.contentType, parsed.data.recordId, admin.tenantId);
    if (!record) return { success: false, error: 'Record not found.' };

    const attached = await attachImageUrlToRecord({
      contentType: parsed.data.contentType,
      recordId: record.id,
      tenantId: admin.tenantId,
      url: parsed.data.url,
    });
    if (!attached) return { success: false, error: 'Failed to attach image to the CMS record.' };

    await writeAuditLog({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: record.imageUrl ? 'media.replace' : 'media.attach',
      entityType: parsed.data.contentType,
      entityId: record.id,
      before: record.imageUrl ? { imageUrl: record.imageUrl } : null,
      after: { imageUrl: parsed.data.url },
    });

    revalidateCmsImage(parsed.data.contentType, record.slug);
    return { success: true, data: { url: parsed.data.url } };
  } catch (error) {
    return { success: false, error: userError(error) };
  }
}

export async function fillMissingCmsImagesFromCatalogAction(
  rawInput: unknown
): Promise<ActionResult<{ attached: number; skipped: number }>> {
  try {
    const admin = await requireAdmin();
    const parsed = fillMissingSchema.safeParse(rawInput);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' };

    const records = await listCmsImageRecords(parsed.data.contentType, admin.tenantId);
    const selected = parsed.data.recordIds ? new Set(parsed.data.recordIds) : null;
    let attached = 0;
    let skipped = 0;

    for (const record of records) {
      if (selected && !selected.has(record.id)) continue;
      if (record.imageUrl?.trim()) {
        skipped += 1;
        continue;
      }
      const stock = matchStockImage(record.title, record.description);
      const ok = await attachImageUrlToRecord({
        contentType: parsed.data.contentType,
        recordId: record.id,
        tenantId: admin.tenantId,
        url: stock.url,
      });
      if (!ok) continue;
      attached += 1;
      await writeAuditLog({
        tenantId: admin.tenantId,
        actorUserId: admin.id,
        action: 'media.attach',
        entityType: parsed.data.contentType,
        entityId: record.id,
        after: { imageUrl: stock.url, source: 'stock-catalog' },
      });
      revalidateCmsImage(parsed.data.contentType, record.slug);
    }

    return { success: true, data: { attached, skipped } };
  } catch (error) {
    return { success: false, error: userError(error) };
  }
}
