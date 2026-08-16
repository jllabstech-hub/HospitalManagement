const MEDIA_CDN_HOST = (process.env.MEDIA_CDN_HOST || '')
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '')
  .toLowerCase();

const ALLOWED_HOSTS = new Set([
  'images.unsplash.com',
  'storage.googleapis.com',
]);

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return true;
  if (host.endsWith('.amazonaws.com')) return true;
  if (MEDIA_CDN_HOST && host === MEDIA_CDN_HOST) return true;
  return false;
}

export function emptyToNull(value?: string | null): string | null {
  const trimmed = value?.trim() || '';
  return trimmed || null;
}

export function isDisplayableCmsImageUrl(value?: string | null): boolean {
  const trimmed = value?.trim() || '';
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && hostAllowed(parsed.hostname);
  } catch {
    return false;
  }
}

export function sanitizeCmsImageUrl(value?: string | null): string | null {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;
  return isDisplayableCmsImageUrl(trimmed) ? trimmed : null;
}
