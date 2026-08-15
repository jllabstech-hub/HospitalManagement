import { describe, it, expect, beforeEach } from 'vitest';
import { Role, AppointmentStatus } from '@prisma/client';
import { transitionAppointmentStatus, isValidStateTransition } from '../services/manage-appointments';
import { prisma } from '@/server/db/client';

describe('State Machine & Status Transition Specification Tests', () => {
  let doctorUser: { id: string; doctorProfileId: string };
  let patientUser: { id: string; patientProfileId: string };
  let doctorBUser: { id: string; doctorProfileId: string };
  let apptBookedId: string;

  beforeEach(async () => {
    // Cleanup in reverse dependency order
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'statemach.test' } } } },
          { patient: { user: { email: { contains: 'statemach.test' } } } },
          { doctor: { department: { name: { contains: 'State Machine Dept' } } } },
        ],
      },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { user: { email: { contains: 'statemach.test' } } } },
    });
    await prisma.blockedDate.deleteMany({
      where: { doctor: { user: { email: { contains: 'statemach.test' } } } },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'statemach.test' } } },
          { department: { name: { contains: 'State Machine Dept' } } },
          { slug: { startsWith: 'state-mach-doc' } },
        ],
      },
    });
    await prisma.patientProfile.deleteMany({
      where: { user: { email: { contains: 'statemach.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'statemach.test' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'State Machine Dept' } },
    });

    const dept = await prisma.department.create({
      data: { name: 'State Machine Dept', slug: 'state-machine-dept', isActive: true },
    });

    // Doctor A
    const userDocA = await prisma.user.create({
      data: { email: 'statemach.test.doca@hospital.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true },
    });
    const docA = await prisma.doctorProfile.create({
      data: { userId: userDocA.id, departmentId: dept.id, fullName: 'Dr. State Machine A', slug: 'state-mach-doc-a', phoneNumber: '1', qualification: 'MBBS' },
    });
    doctorUser = { id: userDocA.id, doctorProfileId: docA.id };

    // Doctor B
    const userDocB = await prisma.user.create({
      data: { email: 'statemach.test.docb@hospital.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true },
    });
    const docB = await prisma.doctorProfile.create({
      data: { userId: userDocB.id, departmentId: dept.id, fullName: 'Dr. State Machine B', slug: 'state-mach-doc-b', phoneNumber: '2', qualification: 'MBBS' },
    });
    doctorBUser = { id: userDocB.id, doctorProfileId: docB.id };

    // Patient
    const userPat = await prisma.user.create({
      data: { email: 'statemach.test.pat@hospital.com', passwordHash: 'h', role: Role.PATIENT, isActive: true },
    });
    const pat = await prisma.patientProfile.create({
      data: { userId: userPat.id, fullName: 'Patient State Machine', phoneNumber: '3', dateOfBirth: new Date('1990-01-01'), gender: 'MALE' },
    });
    patientUser = { id: userPat.id, patientProfileId: pat.id };
    expect(patientUser.patientProfileId).toBeDefined();

    // Seed BOOKED appointment
    const targetUtc = new Date(Date.UTC(2026, 11, 25, 0, 0, 0, 0));
    const appt = await prisma.appointment.create({
      data: {
        patientId: pat.id,
        doctorId: docA.id,
        appointmentDate: targetUtc,
        startTime: '10:00',
        endTime: '10:30',
        status: AppointmentStatus.BOOKED,
      },
    });
    apptBookedId = appt.id;
  });

  it('1. Pure State Machine Transition Rules Validation', () => {
    // Valid
    expect(isValidStateTransition(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED, Role.DOCTOR)).toBe(true);
    expect(isValidStateTransition(AppointmentStatus.BOOKED, AppointmentStatus.CANCELLED, Role.PATIENT)).toBe(true);
    expect(isValidStateTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, Role.DOCTOR)).toBe(true);
    expect(isValidStateTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.NO_SHOW, Role.DOCTOR)).toBe(true);
    expect(isValidStateTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, Role.DOCTOR)).toBe(true);

    // Invalid
    expect(isValidStateTransition(AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED, Role.DOCTOR)).toBe(false);
    expect(isValidStateTransition(AppointmentStatus.BOOKED, AppointmentStatus.NO_SHOW, Role.DOCTOR)).toBe(false);
    expect(isValidStateTransition(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, Role.DOCTOR)).toBe(false);
    expect(isValidStateTransition(AppointmentStatus.CANCELLED, AppointmentStatus.CONFIRMED, Role.DOCTOR)).toBe(false);
    expect(isValidStateTransition(AppointmentStatus.NO_SHOW, AppointmentStatus.CONFIRMED, Role.DOCTOR)).toBe(false);
  });

  it('2. Doctor successfully confirms a BOOKED appointment (BOOKED -> CONFIRMED)', async () => {
    const res = await transitionAppointmentStatus({
      appointmentId: apptBookedId,
      actorUser: { id: doctorUser.id, role: Role.DOCTOR, doctorProfileId: doctorUser.doctorProfileId },
      targetStatus: AppointmentStatus.CONFIRMED,
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe(AppointmentStatus.CONFIRMED);
  });

  it('3. Doctor completes a CONFIRMED appointment (CONFIRMED -> COMPLETED)', async () => {
    // First confirm
    await prisma.appointment.update({ where: { id: apptBookedId }, data: { status: AppointmentStatus.CONFIRMED } });

    const res = await transitionAppointmentStatus({
      appointmentId: apptBookedId,
      actorUser: { id: doctorUser.id, role: Role.DOCTOR, doctorProfileId: doctorUser.doctorProfileId },
      targetStatus: AppointmentStatus.COMPLETED,
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe(AppointmentStatus.COMPLETED);
  });

  it('4. Rejects invalid direct transition BOOKED -> COMPLETED', async () => {
    const res = await transitionAppointmentStatus({
      appointmentId: apptBookedId,
      actorUser: { id: doctorUser.id, role: Role.DOCTOR, doctorProfileId: doctorUser.doctorProfileId },
      targetStatus: AppointmentStatus.COMPLETED,
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('INVALID_TRANSITION');
  });

  it('5. Doctor marks CONFIRMED appointment as NO_SHOW', async () => {
    await prisma.appointment.update({ where: { id: apptBookedId }, data: { status: AppointmentStatus.CONFIRMED } });

    const res = await transitionAppointmentStatus({
      appointmentId: apptBookedId,
      actorUser: { id: doctorUser.id, role: Role.DOCTOR, doctorProfileId: doctorUser.doctorProfileId },
      targetStatus: AppointmentStatus.NO_SHOW,
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe(AppointmentStatus.NO_SHOW);
  });

  it('6. Rejects Doctor B modifying Doctor A\'s appointment', async () => {
    const res = await transitionAppointmentStatus({
      appointmentId: apptBookedId,
      actorUser: { id: doctorBUser.id, role: Role.DOCTOR, doctorProfileId: doctorBUser.doctorProfileId },
      targetStatus: AppointmentStatus.CONFIRMED,
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('FORBIDDEN');
  });
});
