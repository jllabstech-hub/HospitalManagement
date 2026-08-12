import { describe, it, expect, beforeEach } from 'vitest';
import { Role, AppointmentStatus } from '@prisma/client';
import { bookAppointmentTransaction } from '../services/book-appointment';
import { prisma } from '@/server/db/client';

describe('Transactional Appointment Booking Service & Validation Suite', () => {
  let activeDeptId: string;
  let inactiveDeptId: string;
  let activeDoctorId: string;
  let inactiveDoctorId: string;
  let patientProfileId: string;

  beforeEach(async () => {
    // Cleanup test records
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctor: { user: { email: { contains: 'bookingserv.test' } } } },
          { patient: { user: { email: { contains: 'bookingserv.test' } } } },
        ],
      },
    });
    await prisma.weeklyAvailability.deleteMany({
      where: { doctor: { user: { email: { contains: 'bookingserv.test' } } } },
    });
    await prisma.blockedDate.deleteMany({
      where: { doctor: { user: { email: { contains: 'bookingserv.test' } } } },
    });
    await prisma.doctorProfile.deleteMany({
      where: { user: { email: { contains: 'bookingserv.test' } } },
    });
    await prisma.patientProfile.deleteMany({
      where: { user: { email: { contains: 'bookingserv.test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'bookingserv.test' } },
    });
    await prisma.department.deleteMany({
      where: { name: { contains: 'Booking Serv Dept' } },
    });

    // Create active & inactive departments
    const activeDept = await prisma.department.create({
      data: { name: 'Booking Serv Dept Active', slug: 'booking-serv-dept-active', isActive: true },
    });
    activeDeptId = activeDept.id;

    const inactiveDept = await prisma.department.create({
      data: { name: 'Booking Serv Dept Inactive', slug: 'booking-serv-dept-inactive', isActive: false },
    });
    inactiveDeptId = inactiveDept.id;

    // Create Active Doctor
    const userDocA = await prisma.user.create({
      data: {
        email: 'bookingserv.test.doc.act@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: true,
      },
    });
    const docA = await prisma.doctorProfile.create({
      data: {
        userId: userDocA.id,
        departmentId: activeDeptId,
        fullName: 'Dr. Active BookingServ',
        slug: 'booking-serv-doc-act',
        phoneNumber: '111',
        qualification: 'MBBS',
      },
    });
    activeDoctorId = docA.id;

    // Add Weekly Availability for Active Doctor (Mon-Sun 09:00 - 17:00)
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

    // Create Inactive Doctor
    const userDocB = await prisma.user.create({
      data: {
        email: 'bookingserv.test.doc.inact@hospital.com',
        passwordHash: 'hash',
        role: Role.DOCTOR,
        isActive: false,
      },
    });
    const docB = await prisma.doctorProfile.create({
      data: {
        userId: userDocB.id,
        departmentId: activeDeptId,
        fullName: 'Dr. Inactive BookingServ',
        slug: 'booking-serv-doc-inact',
        phoneNumber: '222',
        qualification: 'MBBS',
      },
    });
    inactiveDoctorId = docB.id;

    // Create Patient Profile
    const userPat = await prisma.user.create({
      data: {
        email: 'bookingserv.test.pat@hospital.com',
        passwordHash: 'hash',
        role: Role.PATIENT,
        isActive: true,
      },
    });
    const pat = await prisma.patientProfile.create({
      data: {
        userId: userPat.id,
        fullName: 'Test Patient BookingServ',
        phoneNumber: '333',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'FEMALE',
      },
    });
    patientProfileId = pat.id;
  });

  it('1: Should successfully book an available 30-minute slot (Status BOOKED)', async () => {
    const res = await bookAppointmentTransaction(patientProfileId, {
      doctorId: activeDoctorId,
      appointmentDate: '2026-12-20',
      startTime: '10:00',
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.appointment.status).toBe('BOOKED');
      expect(res.appointment.startTime).toBe('10:00');
      expect(res.appointment.endTime).toBe('10:30');

      // Verify in DB
      const dbAppt = await prisma.appointment.findUnique({ where: { id: res.appointment.id } });
      expect(dbAppt?.status).toBe(AppointmentStatus.BOOKED);
      expect(dbAppt?.patientId).toBe(patientProfileId);
    }
  });

  it('2 & 3: Should reject booking for inactive doctor or inactive department', async () => {
    const resInactiveDoc = await bookAppointmentTransaction(patientProfileId, {
      doctorId: inactiveDoctorId,
      appointmentDate: '2026-12-20',
      startTime: '10:00',
    });
    expect(resInactiveDoc.success).toBe(false);
    if (!resInactiveDoc.success) {
      expect(resInactiveDoc.code).toBe('DOCTOR_UNAVAILABLE');
    }

    // Create doctor in inactive department
    const userC = await prisma.user.create({
      data: { email: 'bookingserv.test.doc.inactdept@hospital.com', passwordHash: 'h', role: Role.DOCTOR, isActive: true },
    });
    const docC = await prisma.doctorProfile.create({
      data: { userId: userC.id, departmentId: inactiveDeptId, fullName: 'Dr. Inact Dept', slug: 'booking-serv-doc-inactdept', phoneNumber: '444', qualification: 'MBBS' },
    });
    const resInactiveDept = await bookAppointmentTransaction(patientProfileId, {
      doctorId: docC.id,
      appointmentDate: '2026-12-20',
      startTime: '10:00',
    });
    expect(resInactiveDept.success).toBe(false);
    if (!resInactiveDept.success) {
      expect(resInactiveDept.code).toBe('DOCTOR_UNAVAILABLE');
    }
  });

  it('4 & 5: Should reject past dates and non-grid times (e.g. 10:15, 10:45)', async () => {
    const resPast = await bookAppointmentTransaction(patientProfileId, {
      doctorId: activeDoctorId,
      appointmentDate: '2020-01-01',
      startTime: '10:00',
    });
    expect(resPast.success).toBe(false);
    if (!resPast.success) {
      expect(resPast.code).toBe('VALIDATION_ERROR');
    }

    const resNonGrid = await bookAppointmentTransaction(patientProfileId, {
      doctorId: activeDoctorId,
      appointmentDate: '2026-12-20',
      startTime: '10:15',
    });
    expect(resNonGrid.success).toBe(false);
    if (!resNonGrid.success) {
      expect(resNonGrid.code).toBe('VALIDATION_ERROR');
      expect(resNonGrid.message).toContain('30-minute grid');
    }
  });

  it('6: Should revalidate slots server-side and reject slot if already occupied by an active appointment', async () => {
    const targetUtc = new Date(Date.UTC(2026, 11, 20, 0, 0, 0, 0));

    // Pre-create an active appointment on 10:30
    await prisma.appointment.create({
      data: {
        patientId: patientProfileId,
        doctorId: activeDoctorId,
        appointmentDate: targetUtc,
        startTime: '10:30',
        endTime: '11:00',
        status: AppointmentStatus.BOOKED,
      },
    });

    // Attempt booking 10:30
    const res = await bookAppointmentTransaction(patientProfileId, {
      doctorId: activeDoctorId,
      appointmentDate: '2026-12-20',
      startTime: '10:30',
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.code).toBe('SLOT_UNAVAILABLE');
    }
  });

  it('7 & 8: Should allow booking a slot previously occupied by CANCELLED or NO_SHOW appointment', async () => {
    const targetUtc = new Date(Date.UTC(2026, 11, 20, 0, 0, 0, 0));

    // Create CANCELLED appointment on 11:00
    await prisma.appointment.create({
      data: {
        patientId: patientProfileId,
        doctorId: activeDoctorId,
        appointmentDate: targetUtc,
        startTime: '11:00',
        endTime: '11:30',
        status: AppointmentStatus.CANCELLED,
      },
    });

    const resRebook = await bookAppointmentTransaction(patientProfileId, {
      doctorId: activeDoctorId,
      appointmentDate: '2026-12-20',
      startTime: '11:00',
    });

    expect(resRebook.success).toBe(true);
  });
});
