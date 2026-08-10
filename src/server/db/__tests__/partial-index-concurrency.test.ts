import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../client';
import { AppointmentStatus, Role } from '@prisma/client';

describe('Database Partial Unique Index Verification (Requirement 26)', () => {
  let testDoctorId: string;
  let testPatient1Id: string;
  let testPatient2Id: string;

  beforeEach(async () => {
    // Clear appointments table for a clean test state
    await prisma.appointment.deleteMany();

    // Fetch existing doctor and patients from seed data
    const doctor = await prisma.doctorProfile.findFirst();
    const patients = await prisma.patientProfile.findMany({ take: 2 });

    expect(doctor).not.toBeNull();
    expect(patients.length).toBeGreaterThanOrEqual(2);

    testDoctorId = doctor!.id;
    testPatient1Id = patients[0].id;
    testPatient2Id = patients[1].id;
  });

  it('CASE A: BOOKED and CONFIRMED on exact same slot CANNOT coexist (Triggers P2002)', async () => {
    // 1. Create first appointment in BOOKED status
    await prisma.appointment.create({
      data: {
        patientId: testPatient1Id,
        doctorId: testDoctorId,
        appointmentDate: new Date('2026-08-15'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.BOOKED,
      },
    });

    // 2. Attempt to create second appointment on same slot with status CONFIRMED
    await expect(
      prisma.appointment.create({
        data: {
          patientId: testPatient2Id,
          doctorId: testDoctorId,
          appointmentDate: new Date('2026-08-15'),
          startTime: '10:00:00',
          endTime: '10:30:00',
          status: AppointmentStatus.CONFIRMED,
        },
      })
    ).rejects.toThrow();
  });

  it('CASE B: BOOKED and BOOKED on exact same slot CANNOT coexist (Triggers P2002)', async () => {
    // 1. Create first appointment in BOOKED status
    await prisma.appointment.create({
      data: {
        patientId: testPatient1Id,
        doctorId: testDoctorId,
        appointmentDate: new Date('2026-08-15'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.BOOKED,
      },
    });

    // 2. Attempt to create second appointment on exact same slot in BOOKED status
    await expect(
      prisma.appointment.create({
        data: {
          patientId: testPatient2Id,
          doctorId: testDoctorId,
          appointmentDate: new Date('2026-08-15'),
          startTime: '10:00:00',
          endTime: '10:30:00',
          status: AppointmentStatus.BOOKED,
        },
      })
    ).rejects.toThrow();
  });

  it('CASE C: CANCELLED and BOOKED on exact same slot CAN coexist', async () => {
    // 1. Create appointment in CANCELLED status
    await prisma.appointment.create({
      data: {
        patientId: testPatient1Id,
        doctorId: testDoctorId,
        appointmentDate: new Date('2026-08-15'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.CANCELLED,
        cancellationReason: 'Cancelled by patient',
        cancelledBy: Role.PATIENT,
      },
    });

    // 2. Create new appointment on same slot in BOOKED status - MUST SUCCEED
    const newBooking = await prisma.appointment.create({
      data: {
        patientId: testPatient2Id,
        doctorId: testDoctorId,
        appointmentDate: new Date('2026-08-15'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.BOOKED,
      },
    });

    expect(newBooking).toBeDefined();
    expect(newBooking.status).toBe(AppointmentStatus.BOOKED);
  });

  it('CASE D: NO_SHOW and BOOKED on exact same slot CAN coexist', async () => {
    // 1. Create appointment in NO_SHOW status
    await prisma.appointment.create({
      data: {
        patientId: testPatient1Id,
        doctorId: testDoctorId,
        appointmentDate: new Date('2026-08-15'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.NO_SHOW,
      },
    });

    // 2. Create new appointment on same slot in BOOKED status - MUST SUCCEED
    const newBooking = await prisma.appointment.create({
      data: {
        patientId: testPatient2Id,
        doctorId: testDoctorId,
        appointmentDate: new Date('2026-08-15'),
        startTime: '10:00:00',
        endTime: '10:30:00',
        status: AppointmentStatus.BOOKED,
      },
    });

    expect(newBooking).toBeDefined();
    expect(newBooking.status).toBe(AppointmentStatus.BOOKED);
  });
});
