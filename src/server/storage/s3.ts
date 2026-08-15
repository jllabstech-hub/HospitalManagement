import { DomainError } from '@/server/errors/domain-error';
import { buildTenantObjectKey } from './keys';
import type { ObjectStorageClient, StorageProvider, UploadObjectInput, UploadObjectResult } from './types';

async function defaultS3Put(input: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  isPrivate: boolean;
}): Promise<void> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  });
  await client.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    })
  );
}

async function defaultS3Delete(input: { bucket: string; key: string }): Promise<void> {
  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  });
  await client.send(
    new DeleteObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
    })
  );
}

export class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;
  private cdnHost?: string;
  private client?: ObjectStorageClient;

  constructor(client?: ObjectStorageClient) {
    const bucket = process.env.MEDIA_BUCKET;
    if (!bucket) {
      throw new DomainError(
        'STORAGE_UNCONFIGURED',
        'MEDIA_BUCKET environment variable is required for S3 object storage.',
        undefined,
        503
      );
    }
    this.bucket = bucket;
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.cdnHost = process.env.MEDIA_CDN_HOST;
    this.client = client;
  }

  private assertCredentials(): void {
    if (this.client) return;
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new DomainError(
        'STORAGE_UNCONFIGURED',
        'S3 credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) are missing.',
        undefined,
        503
      );
    }
  }

  async uploadObject(input: UploadObjectInput): Promise<UploadObjectResult> {
    this.assertCredentials();
    const key = buildTenantObjectKey(input);
    const put = this.client?.putObject ?? defaultS3Put;
    await put({
      bucket: this.bucket,
      key,
      body: input.buffer,
      contentType: input.mimeType,
      isPrivate: Boolean(input.isPrivate),
    });
    return {
      key,
      publicUrl: this.getPublicUrl(key),
    };
  }

  async deleteObject(key: string): Promise<boolean> {
    if (!key) return false;
    this.assertCredentials();
    const del = this.client?.deleteObject ?? defaultS3Delete;
    await del({ bucket: this.bucket, key });
    return true;
  }

  getPublicUrl(key: string): string {
    if (this.cdnHost) {
      return `https://${this.cdnHost}/${key}`;
    }
    const endpoint = process.env.S3_ENDPOINT || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `${endpoint.replace(/\/$/, '')}/${key}`;
  }
}
