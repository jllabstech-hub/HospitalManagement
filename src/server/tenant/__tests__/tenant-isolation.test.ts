import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { runWithTenantContext } from '@/server/tenant';
import { getPublishedDepartments } from '@/features/cms/queries/catalog';
import { getPublicDoctorByIdOrSlug } from '@/features/cms/queries/doctors-public';
import { bookAppointmentTransaction } from '@/features/appointments/services/book-appointment';
import { transitionAppointmentStatus } from '@/features/appointments/services/manage-appointments';
import { computeAvailableSlots } from '@/features/appointments/domain/slot-engine';

const PREFIX = 'tenant.iso.test';

function ctx(tenantId: string, host: string) {
  return {
    tenantId,
    hospitalName: host,
    timezone: 'Asia/Kolkata',
    customDomain: host,
    subdomain: null,
    isActive: true,
    host,
  };
}

describe('Multi-tenant isolation', () => {
  let tenantA: string;
  let tenantB: string;
  let deptA: string;
  let deptB: string;
  let doctorA: string;
  let doctorB: string;
  let patientA: string;
  let appointmentA: string;

  beforeAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.weeklyAvailability.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.patientProfile.deleteMany({ where: { user: { email: { contains: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });

    const a = await prisma.hospitalProfile.create({
      data: { hospitalName: 'Hospital A', customDomain: `${PREFIX}-a.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    const b = await prisma.hospitalProfile.create({
      data: { hospitalName: 'Hospital B', customDomain: `${PREFIX}-b.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    tenantA = a.id;
    tenantB = b.id;

    const da = await prisma.department.create({
      data: { name: `${PREFIX} Cardiology A`, slug: `${PREFIX}-card-a`, tenantId: tenantA, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    const db = await prisma.department.create({
      data: { name: `${PREFIX} Cardiology B`, slug: `${PREFIX}-card-b`, tenantId: tenantB, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    deptA = da.id;
    deptB = db.id;

    const uDocA = await prisma.user.create({ data: { email: `${PREFIX}.doc.a@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: tenantA } });
    const uDocB = await prisma.user.create({ data: { email: `${PREFIX}.doc.b@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: tenantB } });
    const docA = await prisma.doctorProfile.create({
      data: { userId: uDocA.id, departmentId: deptA, tenantId: tenantA, fullName: 'Dr A', slug: `${PREFIX}-doc-a`, phoneNumber: '1', qualification: 'MBBS', contentStatus: ContentStatus.PUBLISHED },
    });
    const docB = await prisma.doctorProfile.create({
      data: { userId: uDocB.id, departmentId: deptB, tenantId: tenantB, fullName: 'Dr B', slug: `${PREFIX}-doc-b`, phoneNumber: '2', qualification: 'MBBS', contentStatus: ContentStatus.PUBLISHED },
    });
    doctorA = docA.id;
    doctorB = docB.id;

    for (let day = 0; day <= 6; day++) {
      await prisma.weeklyAvailability.create({ data: { doctorId: doctorA, tenantId: tenantA, dayOfWeek: day, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 } });
      await prisma.weeklyAvailability.create({ data: { doctorId: doctorB, tenantId: tenantB, dayOfWeek: day, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 } });
    }

    const uPatA = await prisma.user.create({ data: { email: `${PREFIX}.pat.a@h.com`, passwordHash: 'x', role: Role.PATIENT, isActive: true, tenantId: tenantA } });
    const patA = await prisma.patientProfile.create({
      data: { userId: uPatA.id, tenantId: tenantA, fullName: 'Pat A', phoneNumber: '999', dateOfBirth: new Date('1990-01-01'), gender: 'Other' },
    });
    patientA = patA.id;

    const appt = await prisma.appointment.create({
      data: {
        tenantId: tenantA,
        patientId: patientA,
        doctorId: doctorA,
        appointmentDate: new Date('2026-09-01T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '09:30',
        status: 'BOOKED',
      },
    });
    appointmentA = appt.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.weeklyAvailability.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.mediaAsset.deleteMany({ where: { url: { contains: 'iso-b' } } });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.patientProfile.deleteMany({ where: { user: { email: { contains: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });
  });

  it('does not return Tenant B departments on Tenant A public pages', async () => {
    const depts = await runWithTenantContext(ctx(tenantA, `${PREFIX}-a.example`), () => getPublishedDepartments());
    expect(depts.some((d) => d.id === deptA)).toBe(true);
    expect(depts.some((d) => d.id === deptB)).toBe(false);
  });

  it('does not return Tenant B doctors by slug on Tenant A', async () => {
    const doctor = await runWithTenantContext(ctx(tenantA, `${PREFIX}-a.example`), () => getPublicDoctorByIdOrSlug(`${PREFIX}-doc-b`));
    expect(doctor).toBeNull();
  });

  it('rejects cross-tenant booking of Tenant B doctor by Tenant A patient', async () => {
    const result = await runWithTenantContext(ctx(tenantA, `${PREFIX}-a.example`), () =>
      bookAppointmentTransaction(patientA, {
        doctorId: doctorB,
        appointmentDate: '2026-09-10',
        startTime: '09:00',
      })
    );
    expect(result.success).toBe(false);
  });

  it('rejects cross-tenant appointment access by ID', async () => {
    const result = await runWithTenantContext(ctx(tenantB, `${PREFIX}-b.example`), () =>
      transitionAppointmentStatus({
        appointmentId: appointmentA,
        actorUser: { id: 'x', role: Role.ADMIN },
        targetStatus: 'CANCELLED',
      })
    );
    expect(result.success).toBe(false);
    expect(result.code).toBe('NOT_FOUND');
  });

  it('rejects creating a doctor that references another tenant department at the database', async () => {
    const user = await prisma.user.create({
      data: { email: `${PREFIX}.cross.doc@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: tenantA },
    });
    await expect(
      prisma.doctorProfile.create({
        data: {
          userId: user.id,
          departmentId: deptB,
          tenantId: tenantA,
          fullName: 'Cross',
          slug: `${PREFIX}-cross`,
          phoneNumber: '3',
          qualification: 'MBBS',
        },
      })
    ).rejects.toThrow();
  });

  it('cannot delete Tenant B media from Tenant A scope', async () => {
    const asset = await prisma.mediaAsset.create({
      data: { url: '/uploads/iso-b.jpg', type: 'IMAGE', tenantId: tenantB },
    });
    const deleted = await prisma.mediaAsset.deleteMany({
      where: { id: asset.id, tenantId: tenantA },
    });
    expect(deleted.count).toBe(0);
    const stillThere = await prisma.mediaAsset.findUnique({ where: { id: asset.id } });
    expect(stillThere).not.toBeNull();
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
  });
});

describe('Slot duration is authoritative', () => {
  it('uses 15-minute windows when configured', () => {
    const slots = computeAvailableSlots({
      date: '2026-08-20',
      currentDate: '2026-08-10',
      weeklyAvailability: [{ dayOfWeek: 4, startTime: '09:00', endTime: '09:45', slotDurationMinutes: 15 }],
      blockedDates: [],
      activeAppointments: [],
    });
    expect(slots.map((s) => `${s.startTime}-${s.endTime}`)).toEqual(['09:00-09:15', '09:15-09:30', '09:30-09:45']);
  });
});
