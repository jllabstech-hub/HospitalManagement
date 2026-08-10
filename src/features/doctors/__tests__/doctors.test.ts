import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role } from '@prisma/client';

const mockAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  auth: () => mockAuth(),
}));

import {
  createDoctorAction,
  toggleDoctorStatusAction,
} from '../actions';
import { prisma } from '@/server/db/client';

describe('Doctor Management Server Actions & Security', () => {
  let activeDeptId: string;
  let inactiveDeptId: string;

  beforeEach(async () => {
    mockAuth.mockReset();
    // Clean up test doctors and users with unique email pattern
    await prisma.appointment.deleteMany({
      where: { doctor: { user: { email: { contains: 'doc.crud.test' } } } },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { user: { email: { contains: 'doc.crud.test' } } } },
    });
    await prisma.blockedDate.deleteMany({
      where: { doctor: { user: { email: { contains: 'doc.crud.test' } } } },
    });
    await prisma.doctorProfile.deleteMany({
      where: { user: { email: { contains: 'doc.crud.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'doc.crud.test' } },
    });

    // Ensure active and inactive test departments exist
    let activeDept = await prisma.department.findFirst({ where: { isActive: true } });
    if (!activeDept) {
      activeDept = await prisma.department.create({
        data: { name: 'Active Test Dept', slug: 'active-test-dept', isActive: true },
      });
    }
    activeDeptId = activeDept.id;

    let inactiveDept = await prisma.department.findFirst({ where: { isActive: false } });
    if (!inactiveDept) {
      inactiveDept = await prisma.department.create({
        data: { name: 'Inactive Test Dept', slug: 'inactive-test-dept', isActive: false },
      });
    }
    inactiveDeptId = inactiveDept.id;
  });

  it('1, 3 & 15: Should atomically create Doctor User + DoctorProfile with hashed password', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true },
    });

    const email = 'doc.crud.test.atomic@hospital.com';

    const res = await createDoctorAction({
      fullName: 'Dr. Test Atomic',
      email,
      password: 'TempPassword123!',
      departmentId: activeDeptId,
      qualification: 'MBBS, MD',
      experienceYears: 5,
      phoneNumber: '+91 98765 00000',
      bio: 'Test bio',
    });

    expect(res.success).toBe(true);

    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: { doctorProfile: true },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe(Role.DOCTOR);
    expect(dbUser?.passwordHash).not.toBe('TempPassword123!');
    expect(dbUser?.doctorProfile).not.toBeNull();
    expect(dbUser?.doctorProfile?.departmentId).toBe(activeDeptId);
  });

  it('4, 5 & 6: Should reject duplicate doctor emails (existing patient or doctor)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true },
    });

    const dupEmail = 'doc.crud.test.dup@hospital.com';
    let dupUser = await prisma.user.findUnique({ where: { email: dupEmail } });
    if (!dupUser) {
      dupUser = await prisma.user.create({
        data: {
          email: dupEmail,
          passwordHash: 'hash',
          role: Role.PATIENT,
          isActive: true,
        },
      });
    }

    // Try creating doctor with existing user email
    const resPatientDup = await createDoctorAction({
      fullName: 'Dr. Duplicate Test',
      email: dupEmail,
      password: 'TempPassword123!',
      departmentId: activeDeptId,
      qualification: 'MBBS',
      experienceYears: 2,
      phoneNumber: '+91 98765 11111',
    });

    expect(resPatientDup.success).toBe(false);
    expect(resPatientDup.error).toContain('already exists');
  });

  it('8 & 12: Should reject assignment to an INACTIVE department', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true },
    });

    const res = await createDoctorAction({
      fullName: 'Dr. Inactive Dept Test',
      email: 'doc.crud.test.inactdept@hospital.com',
      password: 'TempPassword123!',
      departmentId: inactiveDeptId,
      qualification: 'MBBS',
      experienceYears: 3,
      phoneNumber: '+91 98765 22222',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('inactive department');
  });

  it('9 & 10: Should allow Admin to deactivate and reactivate doctor user account', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@hospital.com', role: Role.ADMIN, isActive: true },
    });

    const email = 'doc.crud.test.toggle@hospital.com';

    const created = await createDoctorAction({
      fullName: 'Dr. Toggle Status',
      email,
      password: 'TempPassword123!',
      departmentId: activeDeptId,
      qualification: 'MBBS',
      experienceYears: 4,
      phoneNumber: '+91 98765 33333',
    });

    const docId = created.data!.id;

    // Deactivate
    const deactRes = await toggleDoctorStatusAction(docId);
    expect(deactRes.success).toBe(true);

    const dbUserDeact = await prisma.user.findUnique({ where: { email } });
    expect(dbUserDeact?.isActive).toBe(false);

    // Reactivate
    const reactRes = await toggleDoctorStatusAction(docId);
    expect(reactRes.success).toBe(true);

    const dbUserReact = await prisma.user.findUnique({ where: { email } });
    expect(dbUserReact?.isActive).toBe(true);
  });
});
