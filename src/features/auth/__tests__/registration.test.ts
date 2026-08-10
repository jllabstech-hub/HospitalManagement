import { describe, it, expect, beforeEach } from 'vitest';
import { registerPatientAction } from '../actions';
import { prisma } from '@/server/db/client';
import { Role } from '@prisma/client';

describe('Patient Self-Registration & Security', () => {
  beforeEach(async () => {
    // Clean up test registration appointments, profiles, and users
    await prisma.appointment.deleteMany({
      where: { patient: { user: { email: { contains: 'test.registration' } } } },
    });
    await prisma.patientProfile.deleteMany({
      where: { user: { email: { contains: 'test.registration' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.registration' } },
    });
  });

  it('should successfully register a new patient account with a 1:1 PatientProfile', async () => {
    const testEmail = 'test.registration.new@example.com';

    const res = await registerPatientAction({
      fullName: 'Test Registration Patient',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
    });

    expect(res.success).toBe(true);

    // Verify user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { patientProfile: true },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe(Role.PATIENT);
    expect(dbUser?.isActive).toBe(true);
    expect(dbUser?.passwordHash).not.toBe('SecurePassword123!');
    expect(dbUser?.patientProfile).not.toBeNull();
    expect(dbUser?.patientProfile?.fullName).toBe('Test Registration Patient');
  });

  it('should reject registration attempts with an existing email', async () => {
    const testEmail = 'test.registration.dup@example.com';

    // Register first time
    await registerPatientAction({
      fullName: 'First Patient',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
    });

    // Register second time with same email
    const res = await registerPatientAction({
      fullName: 'Second Patient',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe(
      'Unable to create account with these details. Please check your information or sign in.'
    );
  });

  it('should enforce PATIENT role and prevent role tampering', async () => {
    const testEmail = 'test.registration.role@example.com';

    // Attempt registration
    const res = await registerPatientAction({
      fullName: 'Role Tamper Test',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      ...( { role: 'ADMIN' } as unknown as Record<string, string> ),
    });

    expect(res.success).toBe(true);

    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    expect(dbUser?.role).toBe(Role.PATIENT);
    expect(dbUser?.role).not.toBe(Role.ADMIN);
  });
});
