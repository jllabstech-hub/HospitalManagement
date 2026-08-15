import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/server/db/client';
import { processNotificationOutbox } from '../worker';
import { sendViaProvider } from '../providers';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';
import { randomUUID } from 'node:crypto';

vi.mock('../providers', () => ({
  sendViaProvider: vi.fn(async () => ({
    success: true,
    error: null,
  })),
}));

describe('Notification Outbox Concurrency & Provider Tests', () => {
  let tenantId: string;
  let recipientUserId: string;

  beforeEach(async () => {
    const tenant = await prisma.hospitalProfile.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!tenant) throw new Error('No tenant found for test');
    tenantId = tenant.id;
    const user = await prisma.user.findFirst({ where: { tenantId } });
    if (!user) throw new Error('No user found for test');
    recipientUserId = user.id;
    await prisma.notification.deleteMany({ where: { tenantId, lastError: { contains: 'PROVIDER_NOT_CONFIGURED' } } });
    vi.mocked(sendViaProvider).mockReset();
  });

  it('prevents double dispatch when two workers execute processNotificationOutbox concurrently', async () => {
    vi.mocked(sendViaProvider).mockResolvedValue({ success: true, error: null });
    const itemIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    await prisma.notification.deleteMany({
      where: { id: { in: itemIds } },
    });
    await prisma.notification.deleteMany({
      where: { status: NotificationStatus.PENDING },
    });
    for (const id of itemIds) {
      await prisma.notification.create({
        data: {
          id,
          tenantId,
          recipientUserId,
          channel: NotificationChannel.EMAIL,
          type: NotificationType.APPOINTMENT_BOOKED,
          status: NotificationStatus.PENDING,
          nextRetryAt: new Date(Date.now() - 1000),
          payload: { test: true },
        },
      });
    }

    const [res1, res2] = await Promise.all([
      processNotificationOutbox(10),
      processNotificationOutbox(10),
    ]);

    expect(res1.processed + res2.processed).toBe(4);
    const sentCalls = vi.mocked(sendViaProvider).mock.calls.filter((call) => itemIds.includes(String(call[1])));
    expect(new Set(sentCalls.map((call) => String(call[1]))).size).toBe(4);
    expect(sentCalls.length).toBe(4);

    const rows = await prisma.notification.findMany({ where: { id: { in: itemIds } } });
    expect(rows.every((row) => row.status === NotificationStatus.SENT)).toBe(true);

    await prisma.notification.deleteMany({ where: { id: { in: itemIds } } });
  });

  it('fails closed when provider credentials are missing and does not mark status SENT', async () => {
    vi.mocked(sendViaProvider).mockResolvedValue({
      success: false,
      reason: 'PROVIDER_NOT_CONFIGURED',
      error: 'PROVIDER_NOT_CONFIGURED',
    });
    const notifId = randomUUID();
    await prisma.notification.create({
      data: {
        id: notifId,
        tenantId,
        recipientUserId,
        channel: NotificationChannel.EMAIL,
        type: NotificationType.APPOINTMENT_BOOKED,
        status: NotificationStatus.PENDING,
        nextRetryAt: new Date(Date.now() - 1000),
      },
    });

    await processNotificationOutbox(10);
    const updated = await prisma.notification.findUnique({ where: { id: notifId } });

    expect(updated?.status).not.toBe(NotificationStatus.SENT);
    expect(updated?.lastError).toBe('PROVIDER_NOT_CONFIGURED');

    await prisma.notification.deleteMany({ where: { id: notifId } });
  });
});
