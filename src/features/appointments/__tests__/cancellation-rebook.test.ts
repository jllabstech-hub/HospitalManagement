import { describe, it, expect, beforeEach } from 'vitest';
import { Role, AppointmentStatus } from '@prisma/client';
import { transitionAppointmentStatus } from '../services/manage-appointments';
import { bookAppointmentTransaction } from '../services/book-appointment';
import { prisma } from '@/server/db/client';

describe('Cancellation Slot Release & Re-booking Integration Test', () => {
  let docId: string;
  let patAId: string;
  let patBId: string;
  let userPatAId: string;

  beforeEach(async () => {
    // Cleanup in reverse dependency order
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'cancelrebook.test' } } } },
          { patient: { user: { email: { contains: 'cancelrebook.test' } } } },
          { doctor: { department: { name: { contains: 'Cancel Rebook Dept' } } } },
        ],
      },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'cancelrebook.test' } } } },
          { doctor: { department: { name: { contains: 'Cancel Rebook Dept' } } } },
        ],
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'cancelrebook.test' } } },
          { department: { name: { contains: 'Cancel Rebook Dept' } } },
        ],
      },
    });
    await prisma.patientProfile.deleteMany({
      where: { user: { email: { contains: 'cancelrebook.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'cancelrebook.test' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'Cancel Rebook Dept' } },
    });

    const dept = await prisma.department.create({
      data: { name: 'Cancel Rebook Dept', slug: 'cancel-rebook-dept', isActive: true },
    });

    const uDoc = await prisma.user.create({ data: { email: 'cancelrebook.test.doc@h.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true } });
    const doc = await prisma.doctorProfile.create({ data: { userId: uDoc.id, departmentId: dept.id, fullName: 'Dr. CancelRebook', slug: 'cancel-rebook-doc', phoneNumber: '1', qualification: 'MBBS' } });
    docId = doc.id;

    for (let day = 0; day <= 6; day++) {
      await prisma.weeklyAvailability.create({
        data: { doctorId: docId, dayOfWeek: day, startTime: '09:00:00', endTime: '17:00:00' },
      });
    }

    const uPatA = await prisma.user.create({ data: { email: 'cancelrebook.test.pata@h.com', passwordHash: 'h', role: Role.PATIENT, isActive: true } });
    const patA = await prisma.patientProfile.create({ data: { userId: uPatA.id, fullName: 'Patient A CancelRebook', phoneNumber: '1', dateOfBirth: new Date('1990-01-01'), gender: 'FEMALE' } });
    patAId = patA.id;
    userPatAId = uPatA.id;

    const uPatB = await prisma.user.create({ data: { email: 'cancelrebook.test.patb@h.com', passwordHash: 'h', role: Role.PATIENT, isActive: true } });
    const patB = await prisma.patientProfile.create({ data: { userId: uPatB.id, fullName: 'Patient B CancelRebook', phoneNumber: '2', dateOfBirth: new Date('1992-02-02'), gender: 'MALE' } });
    patBId = patB.id;
  });

  it('1. Patient A books -> cancels -> Patient B successfully books the released slot', async () => {
    const bookingInput = {
      doctorId: docId,
      appointmentDate: '2026-12-20',
      startTime: '10:00',
    };

    // 1. Patient A books slot 10:00
    const resA = await bookAppointmentTransaction(patAId, bookingInput);
    expect(resA.success).toBe(true);
    if (!resA.success) return;

    const apptAId = resA.appointment.id;

    // 2. Patient A cancels appointment
    const cancelRes = await transitionAppointmentStatus({
      appointmentId: apptAId,
      actorUser: { id: userPatAId, role: Role.PATIENT, patientProfileId: patAId },
      targetStatus: AppointmentStatus.CANCELLED,
      cancellationReason: 'Personal change of plans',
    });
    expect(cancelRes.success).toBe(true);

    // Verify appointment A is CANCELLED in DB
    const dbApptA = await prisma.appointment.findUnique({ where: { id: apptAId } });
    expect(dbApptA?.status).toBe(AppointmentStatus.CANCELLED);

    // 3. Patient B attempts to book exact same slot (10:00)
    const resB = await bookAppointmentTransaction(patBId, bookingInput);

    // ASSERTION: Slot release via PostgreSQL partial index condition works and Patient B succeeds
    expect(resB.success).toBe(true);
    if (resB.success) {
      expect(resB.appointment.status).toBe('BOOKED');
      expect(resB.appointment.id).not.toBe(apptAId);
    }

    // Verify DB contains 1 CANCELLED appointment and 1 active BOOKED appointment for that slot
    const allApptsInDb = await prisma.appointment.findMany({
      where: { doctorId: docId, appointmentDate: new Date(Date.UTC(2026, 11, 20, 0, 0, 0, 0)), startTime: '10:00' },
    });

    expect(allApptsInDb).toHaveLength(2);
    expect(allApptsInDb.filter((a) => a.status === AppointmentStatus.CANCELLED)).toHaveLength(1);
    expect(allApptsInDb.filter((a) => a.status === AppointmentStatus.BOOKED)).toHaveLength(1);
  });
});
