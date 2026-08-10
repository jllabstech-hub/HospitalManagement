import { describe, it, expect, beforeEach } from 'vitest';
import { Role, AppointmentStatus } from '@prisma/client';
import { getPatientAppointmentDetail, getDoctorAppointmentDetail } from '../services/manage-appointments';
import { prisma } from '@/server/db/client';

describe('Appointment Server-Side Authorization & Ownership Isolation', () => {
  let docAProfileId: string;
  let docBProfileId: string;
  let patAProfileId: string;
  let patBProfileId: string;
  let apptAId: string;

  beforeEach(async () => {
    // Cleanup
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'authscope.test' } } } },
          { patient: { user: { email: { contains: 'authscope.test' } } } },
          { doctor: { department: { name: { contains: 'Auth Scope Dept' } } } },
        ],
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: {
        OR: [
          { user: { email: { contains: 'authscope.test' } } },
          { department: { name: { contains: 'Auth Scope Dept' } } },
        ],
      },
    });
    await prisma.patientProfile.deleteMany({
      where: { user: { email: { contains: 'authscope.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'authscope.test' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'Auth Scope Dept' } },
    });

    const dept = await prisma.department.create({
      data: { name: 'Auth Scope Dept', slug: 'auth-scope-dept', isActive: true },
    });

    // Doctor A & B
    const uDocA = await prisma.user.create({ data: { email: 'authscope.test.doca@h.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true } });
    const docA = await prisma.doctorProfile.create({ data: { userId: uDocA.id, departmentId: dept.id, fullName: 'Dr. Auth Scope A', slug: 'auth-scope-doc-a', phoneNumber: '1', qualification: 'MBBS' } });
    docAProfileId = docA.id;

    const uDocB = await prisma.user.create({ data: { email: 'authscope.test.docb@h.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true } });
    const docB = await prisma.doctorProfile.create({ data: { userId: uDocB.id, departmentId: dept.id, fullName: 'Dr. Auth Scope B', slug: 'auth-scope-doc-b', phoneNumber: '2', qualification: 'MBBS' } });
    docBProfileId = docB.id;

    // Patient A & B
    const uPatA = await prisma.user.create({ data: { email: 'authscope.test.pata@h.com', passwordHash: 'h', role: Role.PATIENT, isActive: true } });
    const patA = await prisma.patientProfile.create({ data: { userId: uPatA.id, fullName: 'Patient Auth Scope A', phoneNumber: '1', dateOfBirth: new Date('1990-01-01'), gender: 'FEMALE' } });
    patAProfileId = patA.id;

    const uPatB = await prisma.user.create({ data: { email: 'authscope.test.patb@h.com', passwordHash: 'h', role: Role.PATIENT, isActive: true } });
    const patB = await prisma.patientProfile.create({ data: { userId: uPatB.id, fullName: 'Patient Auth Scope B', phoneNumber: '2', dateOfBirth: new Date('1992-02-02'), gender: 'MALE' } });
    patBProfileId = patB.id;

    // Appointment for Patient A & Doctor A
    const apptA = await prisma.appointment.create({
      data: {
        patientId: patAProfileId,
        doctorId: docAProfileId,
        appointmentDate: new Date(Date.UTC(2026, 11, 20, 0, 0, 0, 0)),
        startTime: '10:00',
        endTime: '10:30',
        status: AppointmentStatus.BOOKED,
      },
    });
    apptAId = apptA.id;
  });

  it('1: Patient A can view own appointment detail', async () => {
    const res = await getPatientAppointmentDetail(patAProfileId, apptAId);
    expect(res).not.toBeNull();
    expect(res?.id).toBe(apptAId);
  });

  it('2: Patient B CANNOT view Patient A\'s appointment (Returns null / forbidden)', async () => {
    const res = await getPatientAppointmentDetail(patBProfileId, apptAId);
    expect(res).toBeNull();
  });

  it('3: Doctor A can view own appointment detail', async () => {
    const res = await getDoctorAppointmentDetail(docAProfileId, apptAId);
    expect(res).not.toBeNull();
    expect(res?.id).toBe(apptAId);
  });

  it('4: Doctor B CANNOT view Doctor A\'s appointment (Returns null / forbidden)', async () => {
    const res = await getDoctorAppointmentDetail(docBProfileId, apptAId);
    expect(res).toBeNull();
  });
});
