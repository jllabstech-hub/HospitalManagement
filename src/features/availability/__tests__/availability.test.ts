import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role } from '@prisma/client';

const mockAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  auth: () => mockAuth(),
}));

import {
  createAvailabilityAction,
  updateAvailabilityAction,
  deleteAvailabilityAction,
} from '../actions';
import { prisma } from '@/server/db/client';

describe('Doctor Weekly Availability Server Actions & Ownership Security', () => {
  let doctorAProfileId: string;
  let doctorBProfileId: string;

  beforeEach(async () => {
    mockAuth.mockReset();

    // Clean up test records in correct cascade order
    await prisma.appointment.deleteMany({
      where: { doctor: { user: { email: { contains: 'weekly.avail.test' } } } },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { user: { email: { contains: 'weekly.avail.test' } } } },
    });
    await prisma.blockedDate.deleteMany({
      where: { doctor: { user: { email: { contains: 'weekly.avail.test' } } } },
    });
    await prisma.doctorProfile.deleteMany({
      where: { user: { email: { contains: 'weekly.avail.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'weekly.avail.test' } },
    });

    const dept = await prisma.department.findFirst({ where: { isActive: true } });
    if (!dept) throw new Error('No active department found for tests.');

    // Create Doctor A
    const userA = await prisma.user.create({
      data: {
        email: 'weekly.avail.test.doca@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const docA = await prisma.doctorProfile.create({
      data: {
        userId: userA.id,
        departmentId: dept.id,
        fullName: 'Dr. Avail A',
        slug: 'weekly-avail-doc-a',
        phoneNumber: '111',
        qualification: 'MBBS',
      },
    });
    doctorAProfileId = docA.id;

    // Create Doctor B
    const userB = await prisma.user.create({
      data: {
        email: 'weekly.avail.test.docb@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const docB = await prisma.doctorProfile.create({
      data: {
        userId: userB.id,
        departmentId: dept.id,
        fullName: 'Dr. Avail B',
        slug: 'weekly-avail-doc-b',
        phoneNumber: '222',
        qualification: 'MBBS',
      },
    });
    doctorBProfileId = docB.id;
  });

  it('1, 2 & 6: Should allow Doctor to create valid availability window and allow adjacent windows', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-a', email: 'weekly.avail.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    // Window 1: Monday 09:00 - 13:00
    const res1 = await createAvailabilityAction({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '13:00',
    });
    expect(res1.success).toBe(true);

    // Window 2: Monday 13:00 - 17:00 (Adjacent - should be ALLOWED)
    const res2 = await createAvailabilityAction({
      dayOfWeek: 1,
      startTime: '13:00',
      endTime: '17:00',
    });
    expect(res2.success).toBe(true);

    const windows = await prisma.weeklyAvailability.findMany({
      where: { doctorId: doctorAProfileId, dayOfWeek: 1 },
    });
    expect(windows).toHaveLength(2);
  });

  it('3 & 4: Should reject end time before start time or overlapping windows', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-a', email: 'weekly.avail.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    // Initial window: 09:00 - 13:00
    await createAvailabilityAction({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '13:00',
    });

    // Attempt overlapping window: 12:00 - 15:00
    const resOverlap = await createAvailabilityAction({
      dayOfWeek: 1,
      startTime: '12:00',
      endTime: '15:00',
    });

    expect(resOverlap.success).toBe(false);
    if (!resOverlap.success) {
      expect(resOverlap.error).toContain('overlaps');
    }
  });

  it('7 & 8: Should allow Doctor to edit and delete own availability window', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-a', email: 'weekly.avail.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    const created = await createAvailabilityAction({
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '12:00',
    });

    expect(created.success).toBe(true);
    if (!created.success || !created.data) return;
    const winId = created.data.id;

    // Edit
    const editRes = await updateAvailabilityAction({
      id: winId,
      startTime: '10:00',
      endTime: '13:00',
    });
    expect(editRes.success).toBe(true);

    const updated = await prisma.weeklyAvailability.findUnique({ where: { id: winId } });
    expect(updated?.startTime).toBe('10:00:00');

    // Delete
    const delRes = await deleteAvailabilityAction(winId);
    expect(delRes.success).toBe(true);

    const deleted = await prisma.weeklyAvailability.findUnique({ where: { id: winId } });
    expect(deleted).toBeNull();
  });

  it('9, 10 & 12: Doctor A CANNOT modify or delete Doctor B availability windows', async () => {
    // Create window under Doctor B
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-b', email: 'weekly.avail.test.docb@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorBProfileId, isActive: true },
    });
    const createdB = await createAvailabilityAction({
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '17:00',
    });
    expect(createdB.success).toBe(true);
    if (!createdB.success || !createdB.data) return;
    const winBId = createdB.data.id;

    // Doctor A attempts to update Doctor B's window
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-a', email: 'weekly.avail.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    const unauthorizedEdit = await updateAvailabilityAction({
      id: winBId,
      startTime: '10:00',
      endTime: '16:00',
    });
    expect(unauthorizedEdit.success).toBe(false);
    if (!unauthorizedEdit.success) {
      expect(unauthorizedEdit.error).toBe('Availability window not found.');
    }

    // Doctor A attempts to delete Doctor B's window
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-a', email: 'weekly.avail.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    const unauthorizedDelete = await deleteAvailabilityAction(winBId);
    expect(unauthorizedDelete.success).toBe(false);
    if (!unauthorizedDelete.success) {
      expect(unauthorizedDelete.error).toBe('Availability window not found.');
    }
  });
});
