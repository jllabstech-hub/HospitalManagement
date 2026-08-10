import { describe, it, expect, beforeEach } from 'vitest';
import { Role } from '@prisma/client';
import { getAvailableSlotsForDoctorDate } from '../services/get-available-slots';
import { prisma } from '@/server/db/client';

describe('Available Slot Retrieval Service (Integration with Pure Engine)', () => {
  let activeDeptId: string;
  let activeDoctorId: string;
  let inactiveDoctorId: string;

  beforeEach(async () => {
    // Clean up test records
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'slotserv.test' } } } },
          { doctor: { department: { name: { contains: 'Slot Service Dept' } } } },
        ],
      },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'slotserv.test' } } } },
          { doctor: { department: { name: { contains: 'Slot Service Dept' } } } },
        ],
      },
    });
    await prisma.blockedDate.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'slotserv.test' } } } },
          { doctor: { department: { name: { contains: 'Slot Service Dept' } } } },
        ],
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'slotserv.test' } } },
          { department: { name: { contains: 'Slot Service Dept' } } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'slotserv.test' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'Slot Service Dept' } },
    });

    const activeDept = await prisma.department.create({
      data: { name: 'Slot Service Dept Active', slug: 'slot-service-dept-active', isActive: true },
    });
    activeDeptId = activeDept.id;

    // Active Doctor
    const userA = await prisma.user.create({
      data: {
        email: 'slotserv.test.act@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const docA = await prisma.doctorProfile.create({
      data: {
        userId: userA.id,
        departmentId: activeDeptId,
        fullName: 'Dr. Active SlotServ',
        slug: 'slot-serv-doc-act',
        phoneNumber: '111',
        qualification: 'MBBS',
      },
    });
    activeDoctorId = docA.id;

    // Add Weekly Availability (Mon - Sun, 09:00 - 17:00)
    for (let day = 0; day <= 6; day++) {
      await prisma.weeklyAvailability.create({
        data: {
          doctorId: activeDoctorId,
          dayOfWeek: day,
          startTime: '09:00:00',
          endTime: '17:00:00',
        },
      });
    }

    // Inactive Doctor
    const userB = await prisma.user.create({
      data: {
        email: 'slotserv.test.inact@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: false,
      },
    });
    const docB = await prisma.doctorProfile.create({
      data: {
        userId: userB.id,
        departmentId: activeDeptId,
        fullName: 'Dr. Inactive SlotServ',
        slug: 'slot-serv-doc-inact',
        phoneNumber: '222',
        qualification: 'MBBS',
      },
    });
    inactiveDoctorId = docB.id;
  });

  it('1: Should return available slots for valid active doctor and future date', async () => {
    // 2026-12-20 is a future Sunday
    const res = await getAvailableSlotsForDoctorDate(activeDoctorId, '2026-12-20');

    expect(res.success).toBe(true);
    expect(res.slots.length).toBeGreaterThan(0);
    expect(res.slots[0].startTime).toBeDefined();
    expect(res.slots[0].endTime).toBeDefined();
  });

  it('2: Should reject availability request for inactive doctor', async () => {
    const res = await getAvailableSlotsForDoctorDate(inactiveDoctorId, '2026-12-20');

    expect(res.success).toBe(false);
    expect(res.isDoctorUnavailable).toBe(true);
    expect(res.error).toBe('This doctor is currently unavailable for appointments.');
  });

  it('3: Should reject past dates with error message', async () => {
    const res = await getAvailableSlotsForDoctorDate(activeDoctorId, '2020-01-01');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Cannot check availability for a date in the past.');
  });

  it('4: Should handle full-day blocked date gracefully', async () => {
    const targetDateStr = '2026-12-25';
    const targetUtc = new Date(Date.UTC(2026, 11, 25, 0, 0, 0, 0));

    await prisma.blockedDate.create({
      data: {
        doctorId: activeDoctorId,
        startDate: targetUtc,
        endDate: targetUtc,
        startTime: null,
        endTime: null,
        reason: 'Christmas Leave',
      },
    });

    const res = await getAvailableSlotsForDoctorDate(activeDoctorId, targetDateStr);

    expect(res.success).toBe(true);
    expect(res.isFullyBlocked).toBe(true);
    expect(res.slots).toHaveLength(0);
  });
});
