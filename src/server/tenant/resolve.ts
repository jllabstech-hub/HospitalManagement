import { prisma } from '@/server/db/client';
import { DomainError } from '@/server/errors/domain-error';
import {
  DEFAULT_TENANT_TIMEZONE,
  isLocalDevelopmentHost,
  isProductionRuntime,
  isSingleTenantMode,
  normalizeHostname,
  type ResolvedTenant,
} from './types';

function timezoneOf(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value.trim() : DEFAULT_TENANT_TIMEZONE;
}

function toResolvedTenant(
  profile: {
    id: string;
    hospitalName: string;
    timezone: string | null;
    customDomain: string | null;
    subdomain: string | null;
    isActive: boolean;
  },
  host: string
): ResolvedTenant {
  return {
    tenantId: profile.id,
    hospitalName: profile.hospitalName,
    timezone: timezoneOf(profile.timezone),
    customDomain: profile.customDomain,
    subdomain: profile.subdomain,
    isActive: profile.isActive,
    host,
  };
}

/**
 * Resolves a tenant from a trusted request hostname.
 * Does not read client-supplied tenant IDs.
 */
export async function resolveTenantByHost(rawHost: string): Promise<ResolvedTenant | null> {
  const host = normalizeHostname(rawHost);
  if (!host) return null;

  const profileSelect = {
    id: true,
    hospitalName: true,
    timezone: true,
    customDomain: true,
    subdomain: true,
    isActive: true,
  } as const;

  const byDomain = await prisma.hospitalProfile.findUnique({
    where: { customDomain: host },
    select: profileSelect,
  });
  if (byDomain?.isActive) {
    return toResolvedTenant(byDomain, host);
  }

  const bySubdomain = await prisma.hospitalProfile.findUnique({
    where: { subdomain: host },
    select: profileSelect,
  });
  if (bySubdomain?.isActive) {
    return toResolvedTenant(bySubdomain, host);
  }

  const defaultId = process.env.DEFAULT_TENANT_ID?.trim();
  if (defaultId) {
    const byId = await prisma.hospitalProfile.findFirst({
      where: { id: defaultId, isActive: true },
      select: profileSelect,
    });
    if (byId) return toResolvedTenant(byId, host);
  }

  const defaultDomain = process.env.DEFAULT_TENANT_DOMAIN?.trim();
  if (defaultDomain) {
    const mapped = await prisma.hospitalProfile.findFirst({
      where: {
        isActive: true,
        OR: [{ customDomain: defaultDomain }, { subdomain: defaultDomain }],
      },
      select: profileSelect,
      orderBy: { createdAt: 'asc' },
    });
    if (mapped) return toResolvedTenant(mapped, host);
  }

  // Single-hospital mode (default): localhost, Vercel previews, and the
  // production hostname all use the same active hospital.
  if (isSingleTenantMode()) {
    const firstActive = await prisma.hospitalProfile.findFirst({
      where: { isActive: true },
      select: profileSelect,
      orderBy: { createdAt: 'asc' },
    });
    if (firstActive) return toResolvedTenant(firstActive, host);
  }

  if (!isProductionRuntime() && isLocalDevelopmentHost(host) && process.env.ALLOW_DEV_TENANT_FALLBACK === 'true') {
    const firstActive = await prisma.hospitalProfile.findFirst({
      where: { isActive: true },
      select: profileSelect,
      orderBy: { createdAt: 'asc' },
    });
    if (firstActive) return toResolvedTenant(firstActive, host);
  }

  return null;
}

export async function requireTenantByHost(rawHost: string): Promise<ResolvedTenant> {
  const tenant = await resolveTenantByHost(rawHost);
  if (!tenant) {
    throw new DomainError(
      'TENANT_NOT_FOUND',
      'No active hospital is configured for this domain.',
      'This hospital site could not be found.',
      404
    );
  }
  return tenant;
}
