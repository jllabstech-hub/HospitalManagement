import { headers } from 'next/headers';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Role } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { DomainError } from '@/server/errors/domain-error';
import { requireTenantByHost } from './resolve';
import {
  allowMockSessionFallback,
  isTestRuntime,
  type ResolvedTenant,
  type TenantUserContext,
} from './types';
import { isDatabaseUnreachable } from '@/server/db/unreachable';

export const tenantAls = new AsyncLocalStorage<ResolvedTenant | TenantUserContext>();

async function readTrustedHost(): Promise<string> {
  try {
    const headerList = await headers();
    // Middleware overwrites x-tenant-host from the real Host header.
    return headerList.get('x-tenant-host') || headerList.get('host') || '';
  } catch {
    return '';
  }
}

async function resolveFromRequest(): Promise<ResolvedTenant> {
  const stored = tenantAls.getStore();
  if (stored) {
    return stored;
  }

  const host = await readTrustedHost();
  if (host) {
    return requireTenantByHost(host);
  }

  if (isTestRuntime()) {
    const firstActive = await prisma.hospitalProfile.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        hospitalName: true,
        timezone: true,
        customDomain: true,
        subdomain: true,
        isActive: true,
      },
    });
    if (firstActive) {
      return {
        tenantId: firstActive.id,
        hospitalName: firstActive.hospitalName,
        timezone: firstActive.timezone || 'Asia/Kolkata',
        customDomain: firstActive.customDomain,
        subdomain: firstActive.subdomain,
        isActive: firstActive.isActive,
        host: 'test',
      };
    }
  }

  throw new DomainError(
    'TENANT_NOT_FOUND',
    'Unable to resolve hospital tenant from the request host.',
    'This hospital site could not be found.',
    404
  );
}

export async function getTenantContext(): Promise<ResolvedTenant | null> {
  try {
    return await resolveFromRequest();
  } catch (error) {
    if (error instanceof DomainError && error.code === 'TENANT_NOT_FOUND') {
      return null;
    }
    if (isDatabaseUnreachable(error)) {
      return null;
    }
    throw error;
  }
}

export async function requireTenantContext(): Promise<ResolvedTenant> {
  return resolveFromRequest();
}

async function loadActiveUser(userId: string) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(userId)) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      tenantId: true,
      patientProfile: { select: { id: true, tenantId: true } },
      doctorProfile: { select: { id: true, tenantId: true } },
    },
  });
}

function toUserContext(
  tenant: ResolvedTenant,
  user: NonNullable<Awaited<ReturnType<typeof loadActiveUser>>>
): TenantUserContext {
  return {
    ...tenant,
    userId: user.id,
    role: user.role,
    email: user.email,
    isActive: user.isActive,
    patientProfileId: user.patientProfile?.id ?? null,
    doctorProfileId: user.doctorProfile?.id ?? null,
  };
}

/**
 * Authenticates against the current request tenant and revalidates role/active
 * status from the database so deactivation and role changes take effect immediately.
 */
export async function requireTenantUser(allowedRoles?: Role[]): Promise<TenantUserContext> {
  const { auth } = await import('@/features/auth');
  let tenant = await requireTenantContext();
  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    throw new DomainError('UNAUTHORIZED', 'You must be logged in to perform this action.', undefined, 401);
  }

  if (allowMockSessionFallback() && sessionUser.tenantId) {
    const fromSession = await prisma.hospitalProfile.findUnique({
      where: { id: sessionUser.tenantId },
      select: {
        id: true,
        hospitalName: true,
        timezone: true,
        customDomain: true,
        subdomain: true,
        isActive: true,
      },
    });
    if (fromSession?.isActive) {
      tenant = {
        tenantId: fromSession.id,
        hospitalName: fromSession.hospitalName,
        timezone: fromSession.timezone || 'Asia/Kolkata',
        customDomain: fromSession.customDomain,
        subdomain: fromSession.subdomain,
        isActive: fromSession.isActive,
        host: 'test',
      };
    }
  }

  let dbUser = await loadActiveUser(sessionUser.id);
  if (!dbUser && sessionUser.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        tenantId: true,
        patientProfile: { select: { id: true, tenantId: true } },
        doctorProfile: { select: { id: true, tenantId: true } },
      },
    });
  }

  if (!dbUser) {
    if (process.env.NODE_ENV === 'production' || !allowMockSessionFallback()) {
      throw new DomainError(
        'UNAUTHORIZED',
        'Authentication required. Active database record not found.',
        undefined,
        401
      );
    }
    if (allowMockSessionFallback()) {
      if (allowedRoles && !allowedRoles.includes(sessionUser.role)) {
        throw new DomainError(
          'FORBIDDEN',
          'You do not have permission to access this resource.',
          undefined,
          403
        );
      }
      if (sessionUser.isActive === false) {
        throw new DomainError(
          'FORBIDDEN',
          'Your account is inactive. Please contact the administrator.',
          undefined,
          403
        );
      }
      return {
        ...tenant,
        userId: sessionUser.id,
        role: sessionUser.role,
        email: sessionUser.email,
        isActive: sessionUser.isActive,
        patientProfileId: sessionUser.patientProfileId ?? null,
        doctorProfileId: sessionUser.doctorProfileId ?? null,
      };
    }
    throw new DomainError(
      'UNAUTHORIZED',
      'Authentication required. Active database record not found.',
      undefined,
      401
    );
  }

  if (!dbUser.isActive) {
    throw new DomainError(
      'FORBIDDEN',
      'Your account is inactive. Please contact the administrator.',
      undefined,
      403
    );
  }

  if (dbUser.tenantId !== tenant.tenantId) {
    throw new DomainError(
      'FORBIDDEN',
      'You do not have access to this hospital.',
      undefined,
      403
    );
  }

  if (dbUser.patientProfile && dbUser.patientProfile.tenantId !== tenant.tenantId) {
    throw new DomainError('FORBIDDEN', 'Patient profile tenant mismatch.', undefined, 403);
  }
  if (dbUser.doctorProfile && dbUser.doctorProfile.tenantId !== tenant.tenantId) {
    throw new DomainError('FORBIDDEN', 'Doctor profile tenant mismatch.', undefined, 403);
  }

  if (allowedRoles && !allowedRoles.includes(dbUser.role)) {
    throw new DomainError(
      'FORBIDDEN',
      'You do not have permission to access this resource.',
      undefined,
      403
    );
  }

  return toUserContext(tenant, dbUser);
}

export async function requireTenantAdmin(): Promise<TenantUserContext> {
  return requireTenantUser([Role.ADMIN]);
}

export async function requireTenantDoctor(): Promise<TenantUserContext & { doctorProfileId: string }> {
  const ctx = await requireTenantUser([Role.DOCTOR]);
  if (!ctx.doctorProfileId) {
    throw new DomainError('FORBIDDEN', 'Doctor profile not found.', undefined, 403);
  }
  return { ...ctx, doctorProfileId: ctx.doctorProfileId };
}

export async function requireTenantPatient(): Promise<TenantUserContext & { patientProfileId: string }> {
  const ctx = await requireTenantUser([Role.PATIENT]);
  if (!ctx.patientProfileId) {
    throw new DomainError('FORBIDDEN', 'Patient profile not found.', undefined, 403);
  }
  return { ...ctx, patientProfileId: ctx.patientProfileId };
}

export function runWithTenantContext<T>(tenant: ResolvedTenant, fn: () => T): T {
  return tenantAls.run(tenant, fn);
}
