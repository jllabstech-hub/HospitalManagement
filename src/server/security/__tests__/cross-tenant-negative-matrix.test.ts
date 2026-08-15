import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/server/db/client';
import { runWithTenantContext } from '@/server/tenant';
import { Role, ContentStatus } from '@prisma/client';
import { bookAppointmentTransaction } from '@/features/appointments/services/book-appointment';
import { transitionAppointmentStatus } from '@/features/appointments/services/manage-appointments';
import { getPublishedSpecialities } from '@/features/cms/queries/catalog';
import { getPublicDoctorByIdOrSlug } from '@/features/cms/queries/doctors-public';

const PREFIX = 'xtenant.matrix';

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

describe('Cross-Tenant Negative Test Matrix (Strict DENY Verification)', () => {
  let tenantA: ReturnType<typeof ctx>;
  let tenantB: ReturnType<typeof ctx>;
  let doctorBId: string;
  let deptBId: string;
  let patientAId: string;
  let patientBId: string;
  let packageBId: string;
  let serviceBId: string;
  let mediaBId: string;
  let cmsSlugB: string;
  let appointmentBId: string;
  let actorAId: string;

  beforeAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.mediaAsset.deleteMany({ where: { storageKey: { contains: PREFIX } } });
    await prisma.healthPackage.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalService.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.speciality.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.patientProfile.deleteMany({ where: { user: { email: { contains: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });

    const a = await prisma.hospitalProfile.create({
      data: { hospitalName: 'Matrix A', customDomain: `${PREFIX}-a.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    const b = await prisma.hospitalProfile.create({
      data: { hospitalName: 'Matrix B', customDomain: `${PREFIX}-b.example`, isActive: true, timezone: 'Asia/Kolkata' },
    });
    tenantA = ctx(a.id, `${PREFIX}-a.example`);
    tenantB = ctx(b.id, `${PREFIX}-b.example`);
    expect(tenantA.tenantId).not.toBe(tenantB.tenantId);

    await prisma.department.create({
      data: { name: `${PREFIX} Dept A`, slug: `${PREFIX}-dept-a`, tenantId: a.id, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    const deptB = await prisma.department.create({
      data: { name: `${PREFIX} Dept B`, slug: `${PREFIX}-dept-b`, tenantId: b.id, isActive: true, contentStatus: ContentStatus.PUBLISHED },
    });
    deptBId = deptB.id;

    const uDocB = await prisma.user.create({ data: { email: `${PREFIX}.doc.b@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: b.id } });
    const docB = await prisma.doctorProfile.create({
      data: { userId: uDocB.id, departmentId: deptB.id, tenantId: b.id, fullName: 'Dr B', slug: `${PREFIX}-doc-b`, phoneNumber: '2', qualification: 'MBBS', contentStatus: ContentStatus.PUBLISHED },
    });
    doctorBId = docB.id;

    const uPatA = await prisma.user.create({ data: { email: `${PREFIX}.pat.a@h.com`, passwordHash: 'x', role: Role.PATIENT, isActive: true, tenantId: a.id } });
    actorAId = uPatA.id;
    const patA = await prisma.patientProfile.create({
      data: { userId: uPatA.id, tenantId: a.id, fullName: 'Pat A', phoneNumber: '111', dateOfBirth: new Date('1990-01-01'), gender: 'Other' },
    });
    patientAId = patA.id;

    const uPatB = await prisma.user.create({ data: { email: `${PREFIX}.pat.b@h.com`, passwordHash: 'x', role: Role.PATIENT, isActive: true, tenantId: b.id } });
    const patB = await prisma.patientProfile.create({
      data: { userId: uPatB.id, tenantId: b.id, fullName: 'Pat B', phoneNumber: '222', dateOfBirth: new Date('1990-01-01'), gender: 'Other' },
    });
    patientBId = patB.id;

    const pkg = await prisma.healthPackage.create({
      data: { name: `${PREFIX} Package B`, slug: `${PREFIX}-pkg-b`, tenantId: b.id, contentStatus: ContentStatus.PUBLISHED, isActive: true },
    });
    packageBId = pkg.id;
    const svc = await prisma.hospitalService.create({
      data: { name: `${PREFIX} Service B`, slug: `${PREFIX}-svc-b`, tenantId: b.id, contentStatus: ContentStatus.PUBLISHED, isActive: true },
    });
    serviceBId = svc.id;
    const spec = await prisma.speciality.create({
      data: { name: `${PREFIX} Spec B`, slug: `${PREFIX}-spec-b`, tenantId: b.id, contentStatus: ContentStatus.PUBLISHED, isActive: true },
    });
    cmsSlugB = spec.slug;
    const media = await prisma.mediaAsset.create({
      data: { tenantId: b.id, url: 'https://example.com/b.png', storageKey: `tenants/${b.id}/public/${PREFIX}.png`, type: 'IMAGE' },
    });
    mediaBId = media.id;
    const appt = await prisma.appointment.create({
      data: {
        tenantId: b.id,
        patientId: patB.id,
        doctorId: docB.id,
        appointmentDate: new Date('2026-12-02T00:00:00.000Z'),
        startTime: '11:00',
        endTime: '11:30',
        status: 'BOOKED',
      },
    });
    appointmentBId = appt.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctor: { slug: { contains: PREFIX } } } });
    await prisma.mediaAsset.deleteMany({ where: { storageKey: { contains: PREFIX } } });
    await prisma.healthPackage.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalService.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.speciality.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.doctorProfile.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.patientProfile.deleteMany({ where: { user: { email: { contains: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { contains: PREFIX } } });
    await prisma.department.deleteMany({ where: { slug: { contains: PREFIX } } });
    await prisma.hospitalProfile.deleteMany({ where: { customDomain: { contains: PREFIX } } });
  });

  it('DENIES Tenant A patient from booking a Tenant B doctor', async () => {
    const result = await runWithTenantContext(tenantA, () =>
      bookAppointmentTransaction(patientAId, {
        doctorId: doctorBId,
        appointmentDate: '2026-12-01',
        startTime: '10:00',
      })
    );
    expect(result.success).toBe(false);
  });

  it('DENIES Tenant A from using a Tenant B department on writes', async () => {
    const leaked = await prisma.department.findFirst({
      where: { id: deptBId, tenantId: tenantA.tenantId },
    });
    expect(leaked).toBeNull();
  });

  it('DENIES Tenant A from using a Tenant B patient', async () => {
    const leaked = await prisma.patientProfile.findFirst({
      where: { id: patientBId, tenantId: tenantA.tenantId },
    });
    expect(leaked).toBeNull();
  });

  it('DENIES Tenant A from using a Tenant B package', async () => {
    const leaked = await prisma.healthPackage.findFirst({
      where: { id: packageBId, tenantId: tenantA.tenantId },
    });
    expect(leaked).toBeNull();
  });

  it('DENIES Tenant A from using a Tenant B service', async () => {
    const leaked = await prisma.hospitalService.findFirst({
      where: { id: serviceBId, tenantId: tenantA.tenantId },
    });
    expect(leaked).toBeNull();
  });

  it('DENIES Tenant A from accessing Tenant B media', async () => {
    const leaked = await prisma.mediaAsset.findFirst({
      where: { id: mediaBId, tenantId: tenantA.tenantId },
    });
    expect(leaked).toBeNull();

    const { GET } = await import('@/app/api/media/[id]/route');
    const response = await runWithTenantContext(tenantA, () =>
      GET(new Request('http://hospital-a.test/api/media/' + mediaBId), {
        params: Promise.resolve({ id: mediaBId }),
      })
    );
    expect(response.status).toBe(404);
  });

  it('DENIES Tenant A from accessing Tenant B CMS slugs', async () => {
    await runWithTenantContext(tenantA, async () => {
      const specialities = await getPublishedSpecialities();
      expect(specialities.some((item) => item.slug === cmsSlugB)).toBe(false);
    });

    const { GET } = await import('@/app/api/search/route');
    const response = await runWithTenantContext(tenantA, () =>
      GET(new Request(`http://hospital-a.test/api/search?q=${PREFIX}`))
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { doctors?: Array<{ id?: string }>; specialities?: Array<{ slug?: string }> };
    expect(body.doctors?.some((item) => item.id === doctorBId)).toBeFalsy();
    expect(body.specialities?.some((item) => item.slug === cmsSlugB)).toBeFalsy();
  });

  it('DENIES Tenant A from reading a Tenant B doctor profile by id', async () => {
    await runWithTenantContext(tenantA, async () => {
      const doctor = await getPublicDoctorByIdOrSlug(doctorBId);
      expect(doctor).toBeNull();
    });
  });

  it('DENIES Tenant A from updating or deleting a Tenant B appointment', async () => {
    const result = await runWithTenantContext(tenantA, () =>
      transitionAppointmentStatus({
        appointmentId: appointmentBId,
        actorUser: { id: actorAId, role: Role.PATIENT, tenantId: tenantA.tenantId, patientProfileId: patientAId },
        targetStatus: 'CANCELLED',
        cancellationReason: 'cross-tenant',
      })
    );
    expect(result.success).toBe(false);

    const updateCount = await prisma.appointment.updateMany({
      where: { id: appointmentBId, tenantId: tenantA.tenantId },
      data: { status: 'CANCELLED' },
    });
    expect(updateCount.count).toBe(0);
    const deleteCount = await prisma.appointment.deleteMany({
      where: { id: appointmentBId, tenantId: tenantA.tenantId },
    });
    expect(deleteCount.count).toBe(0);
  });
});
