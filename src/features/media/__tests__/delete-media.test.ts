import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Role } from '@prisma/client';

const mockAuth = vi.fn();
const storageMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(async () => true),
}));

vi.mock('@/features/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/server/storage', () => ({
  getStorageProvider: () => ({
    deleteObject: storageMocks.deleteObject,
  }),
}));

import { deleteMediaAssetAction } from '../actions';
import { prisma } from '@/server/db/client';

const PREFIX = 'media.delete.test';

describe('deleteMediaAssetAction', () => {
  let tenantId: string;
  let otherTenantId: string | null = null;

  beforeEach(async () => {
    mockAuth.mockReset();
    storageMocks.deleteObject.mockReset();
    storageMocks.deleteObject.mockResolvedValue(true);

    const tenant = await prisma.hospitalProfile.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
    if (!tenant) throw new Error('Need a hospital profile for media delete tests');
    tenantId = tenant.id;

    await prisma.mediaAsset.deleteMany({ where: { storageKey: { contains: PREFIX } } });
    await prisma.auditLog.deleteMany({ where: { action: 'media.delete', entityId: { contains: PREFIX } } });
  });

  afterEach(async () => {
    await prisma.mediaAsset.deleteMany({ where: { storageKey: { contains: PREFIX } } });
    if (otherTenantId) {
      await prisma.hospitalProfile.deleteMany({ where: { id: otherTenantId } });
      otherTenantId = null;
    }
  });

  it('deletes the storage object then the tenant-scoped DB row and writes an audit log', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true, tenantId },
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        tenantId,
        url: `https://example.com/${PREFIX}.png`,
        storageKey: `tenants/${tenantId}/public/${PREFIX}.png`,
        type: 'IMAGE',
      },
    });

    const result = await deleteMediaAssetAction(asset.id);
    expect(result.success).toBe(true);
    expect(storageMocks.deleteObject).toHaveBeenCalledWith(asset.storageKey);
    expect(await prisma.mediaAsset.findUnique({ where: { id: asset.id } })).toBeNull();

    const audit = await prisma.auditLog.findFirst({
      where: { tenantId, action: 'media.delete', entityId: asset.id },
    });
    expect(audit).not.toBeNull();
  });

  it('treats a missing storage object as success and still removes metadata', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true, tenantId },
    });
    storageMocks.deleteObject.mockRejectedValueOnce(new Error('NoSuchKey'));

    const asset = await prisma.mediaAsset.create({
      data: {
        tenantId,
        url: `https://example.com/${PREFIX}-missing.png`,
        storageKey: `tenants/${tenantId}/public/${PREFIX}-missing.png`,
        type: 'IMAGE',
      },
    });

    const result = await deleteMediaAssetAction(asset.id);
    expect(result.success).toBe(true);
    expect(await prisma.mediaAsset.findUnique({ where: { id: asset.id } })).toBeNull();
  });

  it('does not delete another tenant media asset', async () => {
    const other = await prisma.hospitalProfile.create({
      data: { hospitalName: 'Media Other', customDomain: `${PREFIX}-other.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    otherTenantId = other.id;

    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true, tenantId },
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        tenantId: other.id,
        url: `https://example.com/${PREFIX}-other.png`,
        storageKey: `tenants/${other.id}/public/${PREFIX}-other.png`,
        type: 'IMAGE',
      },
    });

    const result = await deleteMediaAssetAction(asset.id);
    expect(result.success).toBe(false);
    expect(storageMocks.deleteObject).not.toHaveBeenCalled();
    expect(await prisma.mediaAsset.findUnique({ where: { id: asset.id } })).not.toBeNull();

    await prisma.mediaAsset.delete({ where: { id: asset.id } });
  });
});
