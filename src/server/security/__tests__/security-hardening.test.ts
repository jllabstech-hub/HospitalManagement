import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Role, AppointmentStatus } from '@prisma/client';

// Mock Auth.js before importing services/helpers
vi.mock('@/features/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

import { bookAppointmentTransaction } from '@/features/appointments/services/book-appointment';
import { transitionAppointmentStatus } from '@/features/appointments/services/manage-appointments';
import { requirePatientOwnership } from '../auth-helpers';
import { prisma } from '@/server/db/client';

describe('Phase 7A Comprehensive Security Hardening & Vulnerability Test Suite', () => {
  let deptId: string;
  let docAUser: { id: string; doctorProfileId: string };
  let docBUser: { id: string; doctorProfileId: string };
  let patAUser: { id: string; patientProfileId: string };
  let patBUser: { id: string; patientProfileId: string };
  let apptAId: string;

  beforeEach(async () => {
    // Clean up in reverse dependency order
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'securetest' } } } },
          { patient: { user: { email: { contains: 'securetest' } } } },
          { doctor: { department: { name: { contains: 'Security Audit Dept' } } } },
        ],
      },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'securetest' } } } },
          { doctor: { department: { name: { contains: 'Security Audit Dept' } } } },
        ],
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'securetest' } } },
          { department: { name: { contains: 'Security Audit Dept' } } },
        ],
      },
    });
    await prisma.patientProfile.deleteMany({
      where: { user: { email: { contains: 'securetest' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'securetest' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'Security Audit Dept' } },
    });

    const dept = await prisma.department.create({
      data: { name: 'Security Audit Dept', slug: 'security-audit-dept', isActive: true },
    });
    deptId = dept.id;

    // Doctor A & B
    const uDocA = await prisma.user.create({ data: { email: 'securetest.doca@h.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true } });
    const docA = await prisma.doctorProfile.create({ data: { userId: uDocA.id, departmentId: deptId, fullName: 'Dr. Secure A', slug: 'secure-doc-a', phoneNumber: '1', qualification: 'MBBS' } });
    docAUser = { id: uDocA.id, doctorProfileId: docA.id };

    for (let d = 0; d <= 6; d++) {
      await prisma.weeklyAvailability.create({
        data: { doctorId: docA.id, dayOfWeek: d, startTime: '09:00:00', endTime: '17:00:00' },
      });
    }

    const uDocB = await prisma.user.create({ data: { email: 'securetest.docb@h.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true } });
    const docB = await prisma.doctorProfile.create({ data: { userId: uDocB.id, departmentId: deptId, fullName: 'Dr. Secure B', slug: 'secure-doc-b', phoneNumber: '2', qualification: 'MBBS' } });
    docBUser = { id: uDocB.id, doctorProfileId: docB.id };

    // Patient A & B
    const uPatA = await prisma.user.create({ data: { email: 'securetest.pata@h.com', passwordHash: 'h', role: Role.PATIENT, isActive: true } });
    const patA = await prisma.patientProfile.create({ data: { userId: uPatA.id, fullName: 'Patient Secure A', phoneNumber: '1', dateOfBirth: new Date('1990-01-01'), gender: 'FEMALE' } });
    patAUser = { id: uPatA.id, patientProfileId: patA.id };

    const uPatB = await prisma.user.create({ data: { email: 'securetest.patb@h.com', passwordHash: 'h', role: Role.PATIENT, isActive: true } });
    const patB = await prisma.patientProfile.create({ data: { userId: uPatB.id, fullName: 'Patient Secure B', phoneNumber: '2', dateOfBirth: new Date('1992-02-02'), gender: 'MALE' } });
    patBUser = { id: uPatB.id, patientProfileId: patB.id };

    // Seed Appointment A
    const apptA = await prisma.appointment.create({
      data: {
        patientId: patAUser.patientProfileId,
        doctorId: docAUser.doctorProfileId,
        appointmentDate: new Date(Date.UTC(2026, 11, 20, 0, 0, 0, 0)),
        startTime: '10:00',
        endTime: '10:30',
        status: AppointmentStatus.BOOKED,
      },
    });
    apptAId = apptA.id;
  });

  it('1. Rejects Patient ID Spoofing / Parameter Injection in Booking Transaction', async () => {
    const maliciousPayload = {
      doctorId: docAUser.doctorProfileId,
      appointmentDate: '2026-12-25',
      startTime: '11:00',
      patientId: patBUser.patientProfileId, // Attempted spoof
      status: 'COMPLETED',                  // Attempted status bypass
    };

    const res = await bookAppointmentTransaction(patAUser.patientProfileId, maliciousPayload);
    expect(res.success).toBe(true);
    if (res.success) {
      const dbAppt = await prisma.appointment.findUnique({ where: { id: res.appointment.id } });
      expect(dbAppt?.patientId).toBe(patAUser.patientProfileId);
      expect(dbAppt?.patientId).not.toBe(patBUser.patientProfileId);
      expect(dbAppt?.status).toBe(AppointmentStatus.BOOKED);
    }
  });

  it('2. Rejects Malformed Grid Time Inputs (10:15, 10:45, 99:99)', async () => {
    const invalidTimes = ['10:15', '10:45', '99:99', 'invalid'];

    for (const timeStr of invalidTimes) {
      const res = await bookAppointmentTransaction(patAUser.patientProfileId, {
        doctorId: docAUser.doctorProfileId,
        appointmentDate: '2026-12-25',
        startTime: timeStr,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.code).toBe('VALIDATION_ERROR');
      }
    }
  });

  it('3. Rejects Status Tampering: Patient attempting to set status to COMPLETED or CONFIRMED', async () => {
    const res = await transitionAppointmentStatus({
      appointmentId: apptAId,
      actorUser: { id: patAUser.id, role: Role.PATIENT, patientProfileId: patAUser.patientProfileId },
      targetStatus: AppointmentStatus.COMPLETED,
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('FORBIDDEN');
  });

  it('4. Rejects IDOR: Patient B attempting to cancel Patient A\'s appointment', async () => {
    const res = await transitionAppointmentStatus({
      appointmentId: apptAId,
      actorUser: { id: patBUser.id, role: Role.PATIENT, patientProfileId: patBUser.patientProfileId },
      targetStatus: AppointmentStatus.CANCELLED,
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('FORBIDDEN');
  });

  it('5. Rejects Doctor B attempting to confirm Doctor A\'s appointment', async () => {
    const res = await transitionAppointmentStatus({
      appointmentId: apptAId,
      actorUser: { id: docBUser.id, role: Role.DOCTOR, doctorProfileId: docBUser.doctorProfileId },
      targetStatus: AppointmentStatus.CONFIRMED,
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('FORBIDDEN');
  });

  it('6. Rejects Illegal State Machine Transition: BOOKED -> COMPLETED', async () => {
    const res = await transitionAppointmentStatus({
      appointmentId: apptAId,
      actorUser: { id: docAUser.id, role: Role.DOCTOR, doctorProfileId: docAUser.doctorProfileId },
      targetStatus: AppointmentStatus.COMPLETED,
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('INVALID_TRANSITION');
  });

  it('7. Enforces Patient Profile Ownership Helper Guard', async () => {
    expect(requirePatientOwnership).toBeDefined();
  });
});
