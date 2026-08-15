import { randomBytes } from 'node:crypto';

export function sanitizeStorageFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() || 'file';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'file';
}

export function buildTenantObjectKey(input: {
  tenantId: string;
  filename: string;
  isPrivate?: boolean;
}): string {
  const randomHex = randomBytes(16).toString('hex');
  const safeFilename = sanitizeStorageFilename(input.filename);
  const datePrefix = new Date().toISOString().slice(0, 7);
  const visibility = input.isPrivate ? 'private' : 'public';
  return `tenants/${input.tenantId}/${visibility}/${datePrefix}/${randomHex}-${safeFilename}`;
}
