import { Role } from '@prisma/client';
import { DomainError } from '@/server/errors/domain-error';
import {
  requireTenantUser,
  requireTenantAdmin,
  requireTenantDoctor,
  requireTenantPatient,
  type TenantUserContext,
} from '@/server/tenant';

type SessionCompatibleUser = TenantUserContext & {
  id: string;
};

function asSessionUser(ctx: TenantUserContext): SessionCompatibleUser {
  return { ...ctx, id: ctx.userId };
}

export async function getCurrentUser() {
  try {
    const user = await requireTenantUser();
    return asSessionUser(user);
  } catch (error) {
    if (error instanceof DomainError && (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN' || error.code === 'TENANT_NOT_FOUND')) {
      return null;
    }
    throw error;
  }
}

export async function requireAuthenticatedUser() {
  return asSessionUser(await requireTenantUser());
}

export async function requireRole(allowedRole: Role) {
  return asSessionUser(await requireTenantUser([allowedRole]));
}

export async function requirePatient() {
  const user = await requireTenantPatient();
  return { ...asSessionUser(user), patientProfileId: user.patientProfileId };
}

export async function requireDoctor() {
  const user = await requireTenantDoctor();
  return { ...asSessionUser(user), doctorProfileId: user.doctorProfileId };
}

export async function requireAdmin() {
  return asSessionUser(await requireTenantAdmin());
}

export async function requirePatientOwnership(targetPatientProfileId: string) {
  const user = await requireAuthenticatedUser();
  if (user.role === Role.ADMIN) return user;
  if (user.role === Role.PATIENT && user.patientProfileId === targetPatientProfileId) {
    return user;
  }
  throw new DomainError('FORBIDDEN', 'You can only access your own patient records.', undefined, 403);
}

export async function requireDoctorOwnership(targetDoctorProfileId: string) {
  const user = await requireAuthenticatedUser();
  if (user.role === Role.ADMIN) return user;
  if (user.role === Role.DOCTOR && user.doctorProfileId === targetDoctorProfileId) {
    return user;
  }
  throw new DomainError('FORBIDDEN', 'You can only access your own doctor records.', undefined, 403);
}
