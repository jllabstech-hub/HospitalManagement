import { PrismaClient } from '@prisma/client';
import { assertDatabaseIsolation } from '../src/server/db/database-guard';

export default async function globalSetup() {
  process.env.E2E_TEST_MODE = 'true';
  if (process.env.E2E_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
  }
  assertDatabaseIsolation();

  const prisma = new PrismaClient();
  try {
    await prisma.authAttempt.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.otpChallenge.deleteMany();
    const e2eUsers = await prisma.user.findMany({
      where: { email: { startsWith: 'e2e.' } },
      select: { id: true },
    });
    if (e2eUsers.length > 0) {
      const ids = e2eUsers.map((user) => user.id);
      await prisma.patientProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  } finally {
    await prisma.$disconnect();
  }
}
