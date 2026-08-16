import { Role } from '@prisma/client';

export interface ResolvedTenant {
  tenantId: string;
  hospitalName: string;
  timezone: string;
  customDomain: string | null;
  subdomain: string | null;
  isActive: boolean;
  host: string;
}

export interface TenantUserContext extends ResolvedTenant {
  userId: string;
  role: Role;
  email: string;
  isActive: boolean;
  patientProfileId: string | null;
  doctorProfileId: string | null;
}

export const DEFAULT_TENANT_TIMEZONE = 'Asia/Kolkata';

/**
 * One-hospital deployments are the default.
 * Set SINGLE_TENANT=false only when hosting multiple hospitals by domain.
 */
export function isSingleTenantMode(): boolean {
  const raw = process.env.SINGLE_TENANT?.trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return true;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isTestRuntime(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.NODE_ENV === 'test' || process.env.E2E_TEST_MODE === 'true';
}

/**
 * Mock-session fallback is unit-test only. Production can never enable it,
 * even if E2E_TEST_MODE or ALLOW_MOCK_SESSION is set.
 */
export function allowMockSessionFallback(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (process.env.NODE_ENV === 'test') {
    return true;
  }
  return process.env.E2E_TEST_MODE === 'true' && process.env.ALLOW_MOCK_SESSION === 'true';
}

export function normalizeHostname(rawHost: string | null | undefined): string {
  if (!rawHost) return '';
  let host = rawHost.trim().toLowerCase();

  // Strip scheme if a full URL was provided.
  host = host.replace(/^https?:\/\//, '');

  // Take host only (drop path/query).
  host = host.split('/')[0] ?? '';

  // Strip brackets from IPv6 literals.
  host = host.replace(/^\[|\]$/g, '');

  // Strip port.
  if (host.includes(':') && !host.startsWith('[')) {
    const lastColon = host.lastIndexOf(':');
    const maybePort = host.slice(lastColon + 1);
    if (/^\d+$/.test(maybePort)) {
      host = host.slice(0, lastColon);
    }
  }

  // Strip trailing dot from FQDN.
  if (host.endsWith('.')) {
    host = host.slice(0, -1);
  }

  return host;
}

export function isLocalDevelopmentHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.localhost')
  );
}
