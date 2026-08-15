import { PrismaClient } from '@prisma/client';

let client: PrismaClient | undefined;

function prisma() {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}

export async function resetE2eMutableData() {
  const db = prisma();
  await db.authAttempt.deleteMany();
  await db.appointment.deleteMany();
  await db.notification.deleteMany();
  await db.otpChallenge.deleteMany();
  const e2eUsers = await db.user.findMany({
    where: { email: { startsWith: 'e2e.' } },
    select: { id: true },
  });
  if (e2eUsers.length > 0) {
    const ids = e2eUsers.map((user) => user.id);
    await db.patientProfile.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}
