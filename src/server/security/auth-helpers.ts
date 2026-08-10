import { auth } from '@/features/auth';
import { Role } from '@prisma/client';
import { DomainError } from '@/server/errors/domain-error';

/**
 * Returns the currently authenticated user from the active NextAuth session.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Ensures a user is authenticated. Throws UNAUTHORIZED if no active session.
 */
export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new DomainError('UNAUTHORIZED', 'You must be logged in to perform this action.', undefined, 401);
  }
  if (!user.isActive) {
    throw new DomainError('FORBIDDEN', 'Your account is inactive. Please contact the administrator.', undefined, 403);
  }
  return user;
}

/**
 * Ensures the authenticated user has the specified role. Throws FORBIDDEN if role mismatch.
 */
export async function requireRole(allowedRole: Role) {
  const user = await requireAuthenticatedUser();
  if (user.role !== allowedRole) {
    throw new DomainError('FORBIDDEN', 'You do not have permission to access this resource.', undefined, 403);
  }
  return user;
}

/**
 * Ensures user is authenticated as a PATIENT and returns user with patientProfileId.
 */
export async function requirePatient() {
  const user = await requireRole(Role.PATIENT);
  if (!user.patientProfileId) {
    throw new DomainError('FORBIDDEN', 'Patient profile not found.', undefined, 403);
  }
  return { ...user, patientProfileId: user.patientProfileId };
}

/**
 * Ensures user is authenticated as a DOCTOR and returns user with doctorProfileId.
 */
export async function requireDoctor() {
  const user = await requireRole(Role.DOCTOR);
  if (!user.doctorProfileId) {
    throw new DomainError('FORBIDDEN', 'Doctor profile not found.', undefined, 403);
  }
  return { ...user, doctorProfileId: user.doctorProfileId };
}

/**
 * Ensures user is authenticated as an ADMIN.
 */
export async function requireAdmin() {
  return requireRole(Role.ADMIN);
}

/**
 * Verifies that the authenticated user owns the target patient profile.
 * Admins are permitted; Patients can only access their own patient profile.
 */
export async function requirePatientOwnership(targetPatientProfileId: string) {
  const user = await requireAuthenticatedUser();
  if (user.role === Role.ADMIN) return user;
  if (user.role === Role.PATIENT && user.patientProfileId === targetPatientProfileId) {
    return user;
  }
  throw new DomainError('FORBIDDEN', 'You can only access your own patient records.', undefined, 403);
}

/**
 * Verifies that the authenticated user owns the target doctor profile.
 * Admins are permitted; Doctors can only access their own doctor profile.
 */
export async function requireDoctorOwnership(targetDoctorProfileId: string) {
  const user = await requireAuthenticatedUser();
  if (user.role === Role.ADMIN) return user;
  if (user.role === Role.DOCTOR && user.doctorProfileId === targetDoctorProfileId) {
    return user;
  }
  throw new DomainError('FORBIDDEN', 'You can only access your own doctor records.', undefined, 403);
}
