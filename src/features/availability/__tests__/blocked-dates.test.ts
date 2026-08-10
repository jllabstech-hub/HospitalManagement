import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role } from '@prisma/client';
import { getHospitalTodayDateString } from '@/lib/date-utils';

const mockAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  auth: () => mockAuth(),
}));

import {
  createBlockedDateAction,
  updateBlockedDateAction,
  deleteBlockedDateAction,
} from '../actions';
import { prisma } from '@/server/db/client';

describe('Doctor Blocked Date Server Actions & Security', () => {
  let doctorAProfileId: string;
  let doctorBProfileId: string;

  beforeEach(async () => {
    mockAuth.mockReset();

    // Clean up test records in correct cascade order
    await prisma.appointment.deleteMany({
      where: { doctor: { user: { email: { contains: 'blocked.date.test' } } } },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { user: { email: { contains: 'blocked.date.test' } } } },
    });
    await prisma.blockedDate.deleteMany({
      where: { doctor: { user: { email: { contains: 'blocked.date.test' } } } },
    });
    await prisma.doctorProfile.deleteMany({
      where: { user: { email: { contains: 'blocked.date.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'blocked.date.test' } },
    });

    const dept = await prisma.department.findFirst({ where: { isActive: true } });
    if (!dept) throw new Error('No active department found for tests.');

    const userA = await prisma.user.create({
      data: {
        email: 'blocked.date.test.doca@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const docA = await prisma.doctorProfile.create({
      data: {
        userId: userA.id,
        departmentId: dept.id,
        fullName: 'Dr. Block A',
        slug: 'blocked-date-doc-a',
        phoneNumber: '111',
        qualification: 'MBBS',
      },
    });
    doctorAProfileId = docA.id;

    const userB = await prisma.user.create({
      data: {
        email: 'blocked.date.test.docb@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const docB = await prisma.doctorProfile.create({
      data: {
        userId: userB.id,
        departmentId: dept.id,
        fullName: 'Dr. Block B',
        slug: 'blocked-date-doc-b',
        phoneNumber: '222',
        qualification: 'MBBS',
      },
    });
    doctorBProfileId = docB.id;
  });

  it('1 & 2: Should create full-day and partial-day blocked dates', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-a', email: 'blocked.date.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    const todayStr = getHospitalTodayDateString();

    // Partial block: 14:00 - 17:00
    const resPartial = await createBlockedDateAction({
      startDate: todayStr,
      isFullDay: false,
      startTime: '14:00',
      endTime: '17:00',
      reason: 'Hospital meeting',
    });
    expect(resPartial.success).toBe(true);

    const blocks = await prisma.blockedDate.findMany({
      where: { doctorId: doctorAProfileId },
    });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].startTime).toBe('14:00:00');
  });

  it('5, 6 & 9: Should reject past dates and overlapping partial blocks', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-a', email: 'blocked.date.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    // Past date block
    const resPast = await createBlockedDateAction({
      startDate: '2020-01-01',
      isFullDay: true,
    });
    expect(resPast.success).toBe(false);
    expect(resPast.error).toBe('Cannot block a date in the past.');

    // Partial block 1: 14:00 - 17:00
    const todayStr = getHospitalTodayDateString();
    await createBlockedDateAction({
      startDate: todayStr,
      isFullDay: false,
      startTime: '14:00',
      endTime: '17:00',
    });

    // Overlapping partial block 2: 15:00 - 18:00
    const resOverlap = await createBlockedDateAction({
      startDate: todayStr,
      isFullDay: false,
      startTime: '15:00',
      endTime: '18:00',
    });

    expect(resOverlap.success).toBe(false);
    expect(resOverlap.error).toContain('overlaps');
  });

  it('7 & 8: Should allow Doctor to edit and delete own blocked date entry', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-a', email: 'blocked.date.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    const todayStr = getHospitalTodayDateString();

    const created = await createBlockedDateAction({
      startDate: todayStr,
      isFullDay: true,
      reason: 'Initial leave',
    });

    const blockId = created.data!.id;

    // Edit
    const editRes = await updateBlockedDateAction({
      id: blockId,
      startDate: todayStr,
      isFullDay: true,
      reason: 'Updated leave reason',
    });
    expect(editRes.success).toBe(true);

    const updated = await prisma.blockedDate.findUnique({ where: { id: blockId } });
    expect(updated?.reason).toBe('Updated leave reason');

    // Delete
    const delRes = await deleteBlockedDateAction(blockId);
    expect(delRes.success).toBe(true);

    const deleted = await prisma.blockedDate.findUnique({ where: { id: blockId } });
    expect(deleted).toBeNull();
  });

  it('10, 11 & 12: Doctor A CANNOT modify or delete Doctor B blocked date entries', async () => {
    const todayStr = getHospitalTodayDateString();

    // Create block under Doctor B
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-b', email: 'blocked.date.test.docb@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorBProfileId, isActive: true },
    });
    const createdB = await createBlockedDateAction({
      startDate: todayStr,
      isFullDay: true,
    });
    expect(createdB.success).toBe(true);
    const blockBId = createdB.data!.id;

    // Doctor A attempts to update Doctor B's block
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-a', email: 'blocked.date.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    const unauthorizedEdit = await updateBlockedDateAction({
      id: blockBId,
      startDate: todayStr,
      isFullDay: true,
      reason: 'Hacked reason',
    });
    expect(unauthorizedEdit.success).toBe(false);
    expect(unauthorizedEdit.error).toBe('Blocked date record not found.');

    // Doctor A attempts to delete Doctor B's block
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-a', email: 'blocked.date.test.doca@hospital.com', role: Role.DOCTOR, doctorProfileId: doctorAProfileId, isActive: true },
    });

    const unauthorizedDelete = await deleteBlockedDateAction(blockBId);
    expect(unauthorizedDelete.success).toBe(false);
    expect(unauthorizedDelete.error).toBe('Blocked date record not found.');
  });
});
