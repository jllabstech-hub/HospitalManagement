import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '@/server/db/client';

const PREFIX = 'composite.fk.test';

describe('Composite tenant foreign keys', () => {
  let tenantA: string;
  let tenantB: string;
  let deptA: string;
  let deptB: string;
  let doctorA: string;
  let doctorB: string;
  let patientA: string;
  let specialityA: string;
  let specialityB: string;
  let centreA: string;
  let centreB: string;

  beforeAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.doctorSpeciality.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.doctorCentre.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.weeklyAvailability.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.patientProfile.deleteMany({ where: { user: { email: { contains: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.centreOfExcellence.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.speciality.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });

    const a = await prisma.hospitalProfile.create({
      data: { hospitalName: 'FK A', customDomain: `${PREFIX}-a.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    const b = await prisma.hospitalProfile.create({
      data: { hospitalName: 'FK B', customDomain: `${PREFIX}-b.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    tenantA = a.id;
    tenantB = b.id;

    const da = await prisma.department.create({
      data: { name: `${PREFIX} Dept A`, slug: `${PREFIX}-dept-a`, tenantId: tenantA, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    const db = await prisma.department.create({
      data: { name: `${PREFIX} Dept B`, slug: `${PREFIX}-dept-b`, tenantId: tenantB, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    deptA = da.id;
    deptB = db.id;

    const uDocA = await prisma.user.create({
      data: { email: `${PREFIX}.doc.a@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: tenantA },
    });
    const uDocB = await prisma.user.create({
      data: { email: `${PREFIX}.doc.b@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: tenantB },
    });
    const docA = await prisma.doctorProfile.create({
      data: {
        userId: uDocA.id,
        departmentId: deptA,
        tenantId: tenantA,
        fullName: 'Dr FK A',
        slug: `${PREFIX}-doc-a`,
        phoneNumber: '1',
        qualification: 'MBBS',
        contentStatus: ContentStatus.PUBLISHED,
      },
    });
    const docB = await prisma.doctorProfile.create({
      data: {
        userId: uDocB.id,
        departmentId: deptB,
        tenantId: tenantB,
        fullName: 'Dr FK B',
        slug: `${PREFIX}-doc-b`,
        phoneNumber: '2',
        qualification: 'MBBS',
        contentStatus: ContentStatus.PUBLISHED,
      },
    });
    doctorA = docA.id;
    doctorB = docB.id;

    const uPatA = await prisma.user.create({
      data: { email: `${PREFIX}.pat.a@h.com`, passwordHash: 'x', role: Role.PATIENT, isActive: true, tenantId: tenantA },
    });
    const patA = await prisma.patientProfile.create({
      data: {
        userId: uPatA.id,
        tenantId: tenantA,
        fullName: 'Pat FK A',
        phoneNumber: '111',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Other',
      },
    });
    patientA = patA.id;

    const specA = await prisma.speciality.create({
      data: { name: `${PREFIX} Spec A`, slug: `${PREFIX}-spec-a`, tenantId: tenantA, departmentId: deptA, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    const specB = await prisma.speciality.create({
      data: { name: `${PREFIX} Spec B`, slug: `${PREFIX}-spec-b`, tenantId: tenantB, departmentId: deptB, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    specialityA = specA.id;
    specialityB = specB.id;

    const cA = await prisma.centreOfExcellence.create({
      data: { name: `${PREFIX} Centre A`, slug: `${PREFIX}-centre-a`, tenantId: tenantA, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    const cB = await prisma.centreOfExcellence.create({
      data: { name: `${PREFIX} Centre B`, slug: `${PREFIX}-centre-b`, tenantId: tenantB, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    centreA = cA.id;
    centreB = cB.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.doctorSpeciality.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.doctorCentre.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.weeklyAvailability.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.patientProfile.deleteMany({ where: { user: { email: { contains: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.centreOfExcellence.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.speciality.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });
  });

  it('rejects DoctorProfile.departmentId from another tenant', async () => {
    const user = await prisma.user.create({
      data: { email: `${PREFIX}.doc.cross@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: tenantA },
    });
    await expect(
      prisma.doctorProfile.create({
        data: {
          userId: user.id,
          departmentId: deptB,
          tenantId: tenantA,
          fullName: 'Dr Cross Dept',
          slug: `${PREFIX}-doc-cross-dept`,
          phoneNumber: '9',
          qualification: 'MBBS',
        },
      })
    ).rejects.toMatchObject({ code: 'P2003' });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('rejects Appointment.doctorId from another tenant', async () => {
    await expect(
      prisma.appointment.create({
        data: {
          tenantId: tenantA,
          patientId: patientA,
          doctorId: doctorB,
          appointmentDate: new Date('2026-12-01T00:00:00.000Z'),
          startTime: '10:00',
          endTime: '10:30',
          status: 'BOOKED',
        },
      })
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rejects DoctorSpeciality linking a doctor to another tenant speciality', async () => {
    await expect(
      prisma.doctorSpeciality.create({
        data: { doctorId: doctorA, specialityId: specialityB, tenantId: tenantA },
      })
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rejects DoctorCentre linking a doctor to another tenant centre', async () => {
    await expect(
      prisma.doctorCentre.create({
        data: { doctorId: doctorA, centreId: centreB, tenantId: tenantA },
      })
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rejects Speciality.departmentId from another tenant', async () => {
    await expect(
      prisma.speciality.create({
        data: {
          name: `${PREFIX} Spec Cross`,
          slug: `${PREFIX}-spec-cross`,
          tenantId: tenantA,
          departmentId: deptB,
          isActive: true,
          contentStatus: ContentStatus.PUBLISHED,
        },
      })
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('allows same-tenant clinical relationships', async () => {
    const link = await prisma.doctorSpeciality.create({
      data: { doctorId: doctorA, specialityId: specialityA, tenantId: tenantA },
    });
    const centreLink = await prisma.doctorCentre.create({
      data: { doctorId: doctorA, centreId: centreA, tenantId: tenantA },
    });
    expect(link.tenantId).toBe(tenantA);
    expect(centreLink.tenantId).toBe(tenantA);
    await prisma.doctorSpeciality.deleteMany({ where: { doctorId: doctorA, specialityId: specialityA } });
    await prisma.doctorCentre.deleteMany({ where: { doctorId: doctorA, centreId: centreA } });
  });
});
