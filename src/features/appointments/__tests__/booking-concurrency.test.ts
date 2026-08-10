import { describe, it, expect, beforeEach } from 'vitest';
import { Role, AppointmentStatus } from '@prisma/client';
import { bookAppointmentTransaction } from '../services/book-appointment';
import { prisma } from '@/server/db/client';

describe('Real Concurrency & Race-Condition Suite (Requirement 21 & PostgreSQL Partial Unique Index)', () => {
  let activeDeptId: string;
  let doctorId: string;
  let patientAId: string;
  let patientBId: string;

  beforeEach(async () => {
    // Cleanup test records
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'concurrency.test' } } } },
          { patient: { user: { email: { contains: 'concurrency.test' } } } },
          { doctor: { department: { name: { contains: 'Concurrency Dept' } } } },
        ],
      },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'concurrency.test' } } } },
          { doctor: { department: { name: { contains: 'Concurrency Dept' } } } },
        ],
      },
    });
    await prisma.blockedDate.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'concurrency.test' } } } },
          { doctor: { department: { name: { contains: 'Concurrency Dept' } } } },
        ],
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'concurrency.test' } } },
          { department: { name: { contains: 'Concurrency Dept' } } },
        ],
      },
    });
    await prisma.patientProfile.deleteMany({
      where: { user: { email: { contains: 'concurrency.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'concurrency.test' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'Concurrency Dept' } },
    });

    const activeDept = await prisma.department.create({
      data: { name: 'Concurrency Dept Active', isActive: true },
    });
    activeDeptId = activeDept.id;

    // Doctor
    const userDoc = await prisma.user.create({
      data: {
        email: 'concurrency.test.doc@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const doc = await prisma.doctorProfile.create({
      data: {
        userId: userDoc.id,
        departmentId: activeDeptId,
        fullName: 'Dr. Concurrency Specialist',
        phoneNumber: '111',
        qualification: 'MBBS',
      },
    });
    doctorId = doc.id;

    // Weekly Availability (Mon - Sun 09:00 - 17:00)
    for (let day = 0; day <= 6; day++) {
      await prisma.weeklyAvailability.create({
        data: {
          doctorId,
          dayOfWeek: day,
          startTime: '09:00:00',
          endTime: '17:00:00',
        },
      });
    }

    // Patient A
    const userPatA = await prisma.user.create({
      data: {
        email: 'concurrency.test.pata@hospital.com',
        passwordHash: 'hash',
        role: Role.PATIENT,
        isActive: true,
      },
    });
    const patA = await prisma.patientProfile.create({
      data: {
        userId: userPatA.id,
        fullName: 'Patient A Concurrency',
        phoneNumber: '111',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
      },
    });
    patientAId = patA.id;

    // Patient B
    const userPatB = await prisma.user.create({
      data: {
        email: 'concurrency.test.patb@hospital.com',
        passwordHash: 'hash',
        role: Role.PATIENT,
        isActive: true,
      },
    });
    const patB = await prisma.patientProfile.create({
      data: {
        userId: userPatB.id,
        fullName: 'Patient B Concurrency',
        phoneNumber: '222',
        dateOfBirth: new Date('1992-02-02'),
        gender: 'FEMALE',
      },
    });
    patientBId = patB.id;
  });

  it('Simultaneous Parallel Race Test: Exactly ONE succeeds and ONE fails with SLOT_UNAVAILABLE', async () => {
    const bookingInput = {
      doctorId,
      appointmentDate: '2026-12-20',
      startTime: '10:30',
    };

    // Fire both requests simultaneously in parallel
    const [resultA, resultB] = await Promise.all([
      bookAppointmentTransaction(patientAId, bookingInput),
      bookAppointmentTransaction(patientBId, bookingInput),
    ]);

    const results = [resultA, resultB];
    const successCount = results.filter((r) => r.success).length;
    const conflictCount = results.filter((r) => !r.success && r.code === 'SLOT_UNAVAILABLE').length;

    // ASSERTION 1: Exactly one succeeded
    expect(successCount).toBe(1);

    // ASSERTION 2: Exactly one received SLOT_UNAVAILABLE conflict
    expect(conflictCount).toBe(1);

    // ASSERTION 3: Query Database directly to verify EXACTLY ONE active appointment exists in DB
    const targetUtcDate = new Date(Date.UTC(2026, 11, 20, 0, 0, 0, 0));
    const activeApptsInDb = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: targetUtcDate,
        startTime: '10:30',
        status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED] },
      },
    });

    expect(activeApptsInDb).toHaveLength(1);
    expect(activeApptsInDb[0].status).toBe(AppointmentStatus.BOOKED);
  });
});
