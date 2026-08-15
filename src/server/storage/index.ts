import { StorageProvider } from './types';
import { S3StorageProvider } from './s3';
import { GcsStorageProvider } from './gcs';
import { LocalStorageProvider } from './local';
import { DomainError } from '@/server/errors/domain-error';

export * from './types';
export { buildTenantObjectKey } from './keys';

export function getStorageProvider(): StorageProvider {
  const providerType = (process.env.STORAGE_PROVIDER || 's3').toLowerCase();
  const isProduction = process.env.NODE_ENV === 'production';
  const mediaBucket = process.env.MEDIA_BUCKET;

  if (isProduction && (!mediaBucket || mediaBucket.trim() === '')) {
    throw new DomainError(
      'STORAGE_UNCONFIGURED',
      'Object storage configuration is missing. MEDIA_BUCKET environment variable is required in production.',
      'Media upload is currently unavailable due to unconfigured object storage.',
      503
    );
  }

  if (isProduction && providerType === 'local') {
    throw new DomainError(
      'STORAGE_UNCONFIGURED',
      'Local storage provider cannot be used in production.',
      undefined,
      503
    );
  }

  switch (providerType) {
    case 'gcs':
      return new GcsStorageProvider();
    case 'local':
      return new LocalStorageProvider();
    case 's3':
    default:
      return new S3StorageProvider();
  }
}
