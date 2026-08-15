/**
 * Dashboard route matching must not use naive startsWith('/patient') or
 * startsWith('/doctor') — those collide with public CMS paths:
 *   /patient-resources, /doctors, /doctors/:id
 */
export function isDashboardPath(pathname: string, prefix: '/patient' | '/doctor' | '/admin'): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Same-origin post-login redirects only. Rejects protocol-relative URLs,
 * absolute URLs, backslashes, and encoded `//` / `://` bypasses.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null;
  }
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
    return null;
  }

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    decoded.includes('://')
  ) {
    return null;
  }

  return trimmed;
}
