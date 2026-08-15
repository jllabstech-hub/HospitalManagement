import { describe, it, expect } from 'vitest';
import { getStorageProvider } from '../index';
import { S3StorageProvider } from '../s3';
import { LocalStorageProvider } from '../local';
import { buildTenantObjectKey } from '../keys';

describe('Storage Abstraction Production Tests', () => {
  it('fails closed in production if MEDIA_BUCKET is unconfigured', () => {
    const origEnv = process.env.NODE_ENV;
    const origBucket = process.env.MEDIA_BUCKET;
    try {
      // @ts-expect-error mutating NODE_ENV for test
      process.env.NODE_ENV = 'production';
      delete process.env.MEDIA_BUCKET;

      expect(() => getStorageProvider()).toThrow('MEDIA_BUCKET');
    } finally {
      // @ts-expect-error restoring NODE_ENV
      process.env.NODE_ENV = origEnv;
      process.env.MEDIA_BUCKET = origBucket;
    }
  });

  it('fails closed if LocalStorageProvider is initialized in production', () => {
    const origEnv = process.env.NODE_ENV;
    try {
      // @ts-expect-error mutating NODE_ENV for test
      process.env.NODE_ENV = 'production';
      expect(() => new LocalStorageProvider()).toThrow('Local filesystem storage is strictly forbidden in production');
    } finally {
      // @ts-expect-error restoring NODE_ENV
      process.env.NODE_ENV = origEnv;
    }
  });

  it('builds cryptographically unique tenant-scoped object keys', () => {
    const key = buildTenantObjectKey({
      tenantId: 'tenant-123',
      filename: 'doctor-photo.png',
    });
    expect(key).toContain('tenants/tenant-123/public/');
    expect(key).toContain('doctor-photo.png');
    const other = buildTenantObjectKey({
      tenantId: 'tenant-123',
      filename: 'doctor-photo.png',
    });
    expect(other).not.toBe(key);
  });

  it('uploads through the S3 client rather than storing bytes in the database', async () => {
    const origBucket = process.env.MEDIA_BUCKET;
    const origKey = process.env.AWS_ACCESS_KEY_ID;
    const origSecret = process.env.AWS_SECRET_ACCESS_KEY;
    try {
      process.env.MEDIA_BUCKET = 'test-hospital-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test';
      process.env.AWS_SECRET_ACCESS_KEY = 'test';
      const puts: string[] = [];
      const provider = new S3StorageProvider({
        putObject: async (input) => {
          puts.push(input.key);
          expect(input.body.length).toBeGreaterThan(0);
          expect(input.contentType).toBe('image/png');
        },
        deleteObject: async () => undefined,
      });

      const result = await provider.uploadObject({
        tenantId: 'tenant-123',
        filename: 'doctor-photo.png',
        buffer: Buffer.from('fake-image-bytes'),
        mimeType: 'image/png',
      });

      expect(puts).toHaveLength(1);
      expect(result.key).toBe(puts[0]);
      expect(result.key).toContain('tenants/tenant-123/');
      expect(result.publicUrl).toContain('test-hospital-bucket.s3');
    } finally {
      process.env.MEDIA_BUCKET = origBucket;
      process.env.AWS_ACCESS_KEY_ID = origKey;
      process.env.AWS_SECRET_ACCESS_KEY = origSecret;
    }
  });

  it('refuses S3 upload when credentials are missing', async () => {
    const origBucket = process.env.MEDIA_BUCKET;
    const origKey = process.env.AWS_ACCESS_KEY_ID;
    const origSecret = process.env.AWS_SECRET_ACCESS_KEY;
    try {
      process.env.MEDIA_BUCKET = 'test-hospital-bucket';
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      const provider = new S3StorageProvider();
      await expect(
        provider.uploadObject({
          tenantId: 'tenant-123',
          filename: 'x.png',
          buffer: Buffer.from('x'),
          mimeType: 'image/png',
        })
      ).rejects.toThrow('S3 credentials');
    } finally {
      process.env.MEDIA_BUCKET = origBucket;
      process.env.AWS_ACCESS_KEY_ID = origKey;
      process.env.AWS_SECRET_ACCESS_KEY = origSecret;
    }
  });
});
