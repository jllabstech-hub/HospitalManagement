import { writeFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { StorageProvider, UploadObjectInput, UploadObjectResult } from './types';
import { DomainError } from '@/server/errors/domain-error';
import { buildTenantObjectKey } from './keys';

export class LocalStorageProvider implements StorageProvider {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new DomainError(
        'STORAGE_UNCONFIGURED',
        'Local filesystem storage is strictly forbidden in production. Object storage (MEDIA_BUCKET) must be configured.',
        undefined,
        503
      );
    }
  }

  async uploadObject(input: UploadObjectInput): Promise<UploadObjectResult> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const key = buildTenantObjectKey(input);
    const filename = path.basename(key);
    const filePath = path.join(uploadDir, filename);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadDir))) {
      throw new DomainError('VALIDATION_ERROR', 'Invalid target upload path.', undefined, 400);
    }

    await writeFile(resolved, input.buffer);

    return {
      key,
      publicUrl: `/uploads/${filename}`,
    };
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filename = path.basename(key);
      const filePath = path.join(uploadDir, filename);
      await unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const filename = path.basename(key);
    return `/uploads/${filename}`;
  }
}
