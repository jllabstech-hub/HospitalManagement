import { describe, it, expect } from 'vitest';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { runWithTenantContext } from '@/server/tenant';
import { transitionAppointmentStatus } from '@/features/appointments/services/manage-appointments';
import { Role } from '@prisma/client';

describe('Atomic appointment status transitions', () => {
  it('only one concurrent cancellation succeeds', async () => {
    const tenant = await prisma.hospitalProfile.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
    if (!tenant) throw new Error('Need hospital');

    const dept = await prisma.department.findFirst({ where: { tenantId: tenant.id, isActive: true } });
    if (!dept) throw new Error('Need department');

    const suffix = Date.now();
    const uDoc = await prisma.user.create({ data: { email: `atomic.doc.${suffix}@h.com`, passwordHash: 'x', role: Role.DOCTOR, isActive: true, tenantId: tenant.id } });
    const doc = await prisma.doctorProfile.create({
      data: { userId: uDoc.id, departmentId: dept.id, tenantId: tenant.id, fullName: 'Atomic Doc', slug: `atomic-doc-${suffix}`, phoneNumber: '1', qualification: 'MBBS' },
    });
    const uPat = await prisma.user.create({ data: { email: `atomic.pat.${suffix}@h.com`, passwordHash: 'x', role: Role.PATIENT, isActive: true, tenantId: tenant.id } });
    const pat = await prisma.patientProfile.create({
      data: { userId: uPat.id, tenantId: tenant.id, fullName: 'Atomic Pat', phoneNumber: '2', dateOfBirth: new Date('1990-01-01'), gender: 'Other' },
    });
    const appt = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        patientId: pat.id,
        doctorId: doc.id,
        appointmentDate: new Date('2026-10-01T00:00:00.000Z'),
        startTime: '10:00',
        endTime: '10:30',
        status: AppointmentStatus.BOOKED,
      },
    });

    const hostCtx = {
      tenantId: tenant.id,
      hospitalName: tenant.hospitalName,
      timezone: tenant.timezone || 'Asia/Kolkata',
      customDomain: tenant.customDomain,
      subdomain: tenant.subdomain,
      isActive: true,
      host: 'test',
    };

    const results = await Promise.all([
      runWithTenantContext(hostCtx, () =>
        transitionAppointmentStatus({
          appointmentId: appt.id,
          actorUser: { id: uPat.id, role: Role.PATIENT, patientProfileId: pat.id },
          targetStatus: AppointmentStatus.CANCELLED,
          cancellationReason: 'race-a',
        })
      ),
      runWithTenantContext(hostCtx, () =>
        transitionAppointmentStatus({
          appointmentId: appt.id,
          actorUser: { id: uPat.id, role: Role.PATIENT, patientProfileId: pat.id },
          targetStatus: AppointmentStatus.CANCELLED,
          cancellationReason: 'race-b',
        })
      ),
    ]);

    const successes = results.filter((r) => r.success);
    expect(successes).toHaveLength(1);

    const stored = await prisma.appointment.findUnique({ where: { id: appt.id } });
    expect(stored?.status).toBe(AppointmentStatus.CANCELLED);

    await prisma.appointment.delete({ where: { id: appt.id } });
    await prisma.patientProfile.delete({ where: { id: pat.id } });
    await prisma.doctorProfile.delete({ where: { id: doc.id } });
    await prisma.user.deleteMany({ where: { id: { in: [uPat.id, uDoc.id] } } });
  });
});
