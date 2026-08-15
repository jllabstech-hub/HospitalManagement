import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role } from '@prisma/client';

// Mock the auth function from @/features/auth before importing auth-helpers
const mockAuth = vi.fn();

vi.mock('@/features/auth', () => ({
  auth: () => mockAuth(),
}));

import {
  requirePatientOwnership,
  requireDoctorOwnership,
  requireRole,
} from '../auth-helpers';

describe('Server-Side Resource Ownership Authorization Guards', () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it('should allow a PATIENT to access their own patient profile', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'user-1',
        email: 'patient@example.com',
        role: Role.PATIENT,
        isActive: true,
        patientProfileId: 'patient-profile-1',
      },
    });

    const user = await requirePatientOwnership('patient-profile-1');
    expect(user.id).toBe('user-1');
  });

  it('should throw FORBIDDEN when a PATIENT attempts to access another patient profile', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'user-1',
        email: 'patient1@example.com',
        role: Role.PATIENT,
        isActive: true,
        patientProfileId: 'patient-profile-1',
      },
    });

    await expect(
      requirePatientOwnership('patient-profile-OTHER')
    ).rejects.toThrow('You can only access your own patient records.');
  });

  it('should allow an ADMIN to access any patient profile', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'admin-1',
        email: 'admin@hospital.com',
        role: Role.ADMIN,
        isActive: true,
      },
    });

    const user = await requirePatientOwnership('patient-profile-ANY');
    expect(user.role).toBe(Role.ADMIN);
  });

  it('should throw FORBIDDEN when a DOCTOR attempts to access another doctor profile', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'doc-1',
        email: 'dr.smith@hospital.com',
        role: Role.DOCTOR,
        isActive: true,
        doctorProfileId: 'doc-profile-1',
      },
    });

    await expect(
      requireDoctorOwnership('doc-profile-2')
    ).rejects.toThrow('You can only access your own doctor records.');
  });

  it('should throw FORBIDDEN when PATIENT attempts to access DOCTOR role', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'patient-1',
        email: 'patient@example.com',
        role: Role.PATIENT,
        isActive: true,
      },
    });

    await expect(requireRole(Role.DOCTOR)).rejects.toThrow(
      'You do not have permission to access this resource.'
    );
  });

  it('rejects inactive users even with a valid session', async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: 'user-inactive',
        email: 'inactive@example.com',
        role: Role.ADMIN,
        isActive: false,
      },
    });

    await expect(requireRole(Role.ADMIN)).rejects.toThrow(
      'Your account is inactive. Please contact the administrator.'
    );
  });
});
