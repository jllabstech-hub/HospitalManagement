import { createSign, randomUUID } from 'node:crypto';
import { DomainError } from '@/server/errors/domain-error';
import { buildTenantObjectKey } from './keys';
import type { ObjectStorageClient, StorageProvider, UploadObjectInput, UploadObjectResult } from './types';

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function googleAccessToken(): Promise<string> {
  if (process.env.GCS_ACCESS_TOKEN) {
    return process.env.GCS_ACCESS_TOKEN;
  }

  const email = process.env.GCS_CLIENT_EMAIL;
  const key = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) {
    throw new DomainError(
      'STORAGE_UNCONFIGURED',
      'GCS credentials (GCS_CLIENT_EMAIL / GCS_PRIVATE_KEY or GCS_ACCESS_TOKEN) are missing.',
      undefined,
      503
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/devstorage.read_write',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      jti: randomUUID(),
    })
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = base64Url(signer.sign(key));

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });

  if (!response.ok) {
    throw new DomainError('STORAGE_UNCONFIGURED', 'Failed to obtain GCS access token.', undefined, 503);
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new DomainError('STORAGE_UNCONFIGURED', 'GCS token response did not include access_token.', undefined, 503);
  }
  return json.access_token;
}

async function defaultGcsPut(input: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  isPrivate: boolean;
}): Promise<void> {
  const token = await googleAccessToken();
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(input.bucket)}/o?uploadType=media&name=${encodeURIComponent(input.key)}&predefinedAcl=${input.isPrivate ? 'private' : 'publicRead'}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': input.contentType,
    },
    body: new Uint8Array(input.body),
  });
  if (!response.ok) {
    throw new DomainError('STORAGE_UNCONFIGURED', `GCS upload failed with status ${response.status}.`, undefined, 502);
  }
}

async function defaultGcsDelete(input: { bucket: string; key: string }): Promise<void> {
  const token = await googleAccessToken();
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(input.bucket)}/o/${encodeURIComponent(input.key)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 404) {
    throw new DomainError('STORAGE_UNCONFIGURED', `GCS delete failed with status ${response.status}.`, undefined, 502);
  }
}

export class GcsStorageProvider implements StorageProvider {
  private bucket: string;
  private client?: ObjectStorageClient;

  constructor(client?: ObjectStorageClient) {
    const bucket = process.env.MEDIA_BUCKET;
    if (!bucket) {
      throw new DomainError(
        'STORAGE_UNCONFIGURED',
        'MEDIA_BUCKET environment variable is required for GCS object storage.',
        undefined,
        503
      );
    }
    this.bucket = bucket;
    this.client = client;
  }

  async uploadObject(input: UploadObjectInput): Promise<UploadObjectResult> {
    const key = buildTenantObjectKey(input);
    const put = this.client?.putObject ?? defaultGcsPut;
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
    const del = this.client?.deleteObject ?? defaultGcsDelete;
    await del({ bucket: this.bucket, key });
    return true;
  }

  getPublicUrl(key: string): string {
    return `https://storage.googleapis.com/${this.bucket}/${key}`;
  }
}
