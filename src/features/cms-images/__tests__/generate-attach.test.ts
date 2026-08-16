import { Role } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAuth = vi.fn();
const storageMocks = vi.hoisted(() => ({
  uploadObject: vi.fn(async ({ filename }: { filename: string }) => ({
    key: `tenants/test/public/${filename}`,
    publicUrl: `https://cdn.example/${filename}`,
  })),
  deleteObject: vi.fn(async () => true),
}));
const generationMocks = vi.hoisted(() => ({
  generateImage: vi.fn(async () => ({
    bytes: Buffer.from('RIFF....WEBP'),
    mimeType: 'image/webp',
  })),
}));

vi.mock('@/features/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/server/storage', () => ({
  getStorageProvider: () => ({
    uploadObject: storageMocks.uploadObject,
    deleteObject: storageMocks.deleteObject,
  }),
}));

vi.mock('@/server/ai/image-generation', async () => {
  const actual = await vi.importActual<typeof import('@/server/ai/image-generation')>(
    '@/server/ai/image-generation'
  );
  return {
    ...actual,
    getImageGenerationProvider: () => ({
      name: 'mock',
      generateImage: generationMocks.generateImage,
    }),
  };
});

vi.mock('@/features/cms-images/store', async () => {
  const actual = await vi.importActual<typeof import('@/features/cms-images/store')>(
    '@/features/cms-images/store'
  );
  return {
    ...actual,
    storeGeneratedMediaAsset: vi.fn(async ({ tenantId, altText }: { tenantId: string; altText: string }) => {
      const { prisma } = await import('@/server/db/client');
      const media = await prisma.mediaAsset.create({
        data: {
          tenantId,
          url: `https://cdn.example/${altText.replace(/\s+/g, '-').toLowerCase()}.webp`,
          storageKey: `tenants/${tenantId}/public/generated.webp`,
          altText,
          type: 'IMAGE',
          mimeType: 'image/webp',
          width: 1600,
          height: 900,
          fileSize: 1200,
        },
      });
      return {
        id: media.id,
        url: media.url,
        altText: media.altText ?? altText,
        width: media.width,
        height: media.height,
      };
    }),
  };
});

import {
  attachCmsImageAction,
  fillMissingCmsImagesFromCatalogAction,
  generateCmsImageAction,
} from '../actions';
import { prisma } from '@/server/db/client';
import { deleteMediaAssetAction } from '@/features/media/actions';

const PREFIX = 'cms-image.test';

describe('CMS image generation', () => {
  let tenantId: string;
  let otherTenantId: string | null = null;
  let specialityId: string;

  beforeEach(async () => {
    mockAuth.mockReset();
    generationMocks.generateImage.mockClear();
    generationMocks.generateImage.mockResolvedValue({
      bytes: Buffer.from('generated'),
      mimeType: 'image/webp',
    });

    const tenant = await prisma.hospitalProfile.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!tenant) throw new Error('Need a hospital profile for CMS image tests');
    tenantId = tenant.id;

    await prisma.speciality.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.mediaAsset.deleteMany({ where: { storageKey: { contains: PREFIX } } });

    const created = await prisma.speciality.create({
      data: {
        tenantId,
        name: `${PREFIX} Cardiology`,
        slug: `${PREFIX}-cardiology`,
        shortDescription: 'Heart and cardiovascular care',
      },
    });
    specialityId = created.id;
  });

  afterEach(async () => {
    await prisma.speciality.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.mediaAsset.deleteMany({ where: { url: { contains: 'cdn.example' } } });
    if (otherTenantId) {
      await prisma.hospitalProfile.deleteMany({ where: { id: otherTenantId } });
      otherTenantId = null;
    }
  });

  function adminSession(id = tenantId) {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true, tenantId: id },
    });
  }

  it('generates a media asset for the current tenant without attaching it yet', async () => {
    adminSession();
    const result = await generateCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
    });
    expect(result.success).toBe(true);
    if (!result.success || !result.data) throw new Error('expected generation');
    expect(generationMocks.generateImage).toHaveBeenCalled();
    const prompt = generationMocks.generateImage.mock.calls[0][0].prompt as string;
    expect(prompt).toContain('Cardiology');
    expect(prompt).not.toMatch(/^Generate an image of /);

    const media = await prisma.mediaAsset.findFirst({ where: { id: result.data.mediaId } });
    expect(media?.tenantId).toBe(tenantId);
    expect(media?.altText).toContain('cardiovascular care');

    const speciality = await prisma.speciality.findUnique({ where: { id: specialityId } });
    expect(speciality?.imageUrl).toBeNull();
  });

  it('attaches the generated media URL to the CMS record after approval', async () => {
    adminSession();
    const generated = await generateCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
    });
    if (!generated.success || !generated.data) throw new Error('expected generation');

    const attached = await attachCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
      mediaId: generated.data.mediaId,
      replaceExisting: true,
    });
    expect(attached.success).toBe(true);

    const speciality = await prisma.speciality.findUnique({ where: { id: specialityId } });
    expect(speciality?.imageUrl).toBe(generated.data.url);
  });

  it('does not attach another tenant media asset', async () => {
    const other = await prisma.hospitalProfile.create({
      data: {
        hospitalName: `${PREFIX} Other`,
        customDomain: `${PREFIX}-other.example`,
        isActive: true,
        timezone: 'Asia/Kolkata',
      },
    });
    otherTenantId = other.id;
    const foreignMedia = await prisma.mediaAsset.create({
      data: {
        tenantId: other.id,
        url: `https://cdn.example/${PREFIX}-foreign.webp`,
        storageKey: `tenants/${other.id}/public/${PREFIX}.webp`,
        type: 'IMAGE',
      },
    });

    adminSession(tenantId);
    const attached = await attachCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
      mediaId: foreignMedia.id,
      replaceExisting: true,
    });
    expect(attached.success).toBe(false);
    const speciality = await prisma.speciality.findUnique({ where: { id: specialityId } });
    expect(speciality?.imageUrl).toBeNull();
  });

  it('rejects unauthorized generation', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await generateCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
    });
    expect(result.success).toBe(false);
  });

  it('surfaces provider failures without creating a CMS image reference', async () => {
    adminSession();
    generationMocks.generateImage.mockRejectedValueOnce(new Error('provider unavailable'));
    const result = await generateCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
    });
    expect(result.success).toBe(false);
    const speciality = await prisma.speciality.findUnique({ where: { id: specialityId } });
    expect(speciality?.imageUrl).toBeNull();
  });

  it('prevents duplicate in-flight generation for the same record', async () => {
    adminSession();
    generationMocks.generateImage.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ bytes: Buffer.from('generated'), mimeType: 'image/webp' }), 80)
        )
    );
    const first = generateCmsImageAction({ contentType: 'SPECIALITY', recordId: specialityId });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = generateCmsImageAction({ contentType: 'SPECIALITY', recordId: specialityId });
    const results = await Promise.all([first, second]);
    expect(results.some((result) => result.success)).toBe(true);
    expect(results.some((result) => !result.success && result.error.toLowerCase().includes('already running'))).toBe(
      true
    );
  });

  it('does not delete media that is still referenced by a CMS record', async () => {
    adminSession();
    const generated = await generateCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
    });
    if (!generated.success || !generated.data) throw new Error('expected generation');
    await attachCmsImageAction({
      contentType: 'SPECIALITY',
      recordId: specialityId,
      mediaId: generated.data.mediaId,
      replaceExisting: true,
    });

    const deleted = await deleteMediaAssetAction(generated.data.mediaId);
    expect(deleted.success).toBe(false);
    expect(await prisma.mediaAsset.findUnique({ where: { id: generated.data.mediaId } })).not.toBeNull();
  });

  it('fills a missing speciality image from the relevant stock catalog', async () => {
    adminSession();
    const result = await fillMissingCmsImagesFromCatalogAction({
      contentType: 'SPECIALITY',
      recordIds: [specialityId],
    });
    expect(result.success).toBe(true);
    if (!result.success || !result.data) throw new Error('expected fill');
    expect(result.data.attached).toBe(1);

    const speciality = await prisma.speciality.findUnique({ where: { id: specialityId } });
    expect(speciality?.imageUrl).toMatch(/images\.unsplash\.com/);
    expect(speciality?.imageUrl).toMatch(/1631217868264|1628348068343/);
  });
});
