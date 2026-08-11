import { test, expect } from '@playwright/test';
import { prisma } from '../../src/server/db/client';

/**
 * Post-suite integrity checks against the seeded/test database.
 * Runs in Playwright worker after seed (same DATABASE_URL as app).
 */
test.describe('Database integrity audit', () => {
  test('No users without matching role profile when required', async () => {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: { doctorProfile: true },
    });
    for (const d of doctors) {
      expect(d.doctorProfile, `doctor user ${d.email} missing profile`).toBeTruthy();
    }

    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      include: { patientProfile: true },
    });
    for (const p of patients) {
      expect(p.patientProfile, `patient user ${p.email} missing profile`).toBeTruthy();
    }
  });

  test('Appointments only use valid statuses', async () => {
    const allowed = new Set(['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
    const appts = await prisma.appointment.findMany({ select: { id: true, status: true } });
    for (const a of appts) {
      expect(allowed.has(a.status)).toBe(true);
    }
  });

  test('No duplicate active slots for same doctor/date/time', async () => {
    const active = await prisma.appointment.findMany({
      where: { status: { in: ['BOOKED', 'CONFIRMED'] } },
      select: { doctorId: true, appointmentDate: true, startTime: true },
    });
    const keys = active.map(
      (a) => `${a.doctorId}|${a.appointmentDate.toISOString().slice(0, 10)}|${a.startTime}`
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('Appointments reference existing doctors and patients', async () => {
    const orphanDoctor = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c FROM "Appointment" a
      LEFT JOIN "DoctorProfile" d ON d.id = a."doctorId"
      WHERE d.id IS NULL
    `;
    const orphanPatient = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c FROM "Appointment" a
      LEFT JOIN "PatientProfile" p ON p.id = a."patientId"
      WHERE p.id IS NULL
    `;
    expect(Number(orphanDoctor[0].c)).toBe(0);
    expect(Number(orphanPatient[0].c)).toBe(0);
  });
});
