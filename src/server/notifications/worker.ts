import { Prisma, NotificationChannel, NotificationStatus } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { logger } from '@/lib/logger';
import { sendViaProvider } from './providers';

const BACKOFF_MS = [30_000, 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
const CLAIM_LEASE_MS = 5 * 60 * 1000;

type ClaimedNotification = {
  id: string;
  tenantId: string;
  recipientUserId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  attemptCount: number;
  maxAttempts: number;
};

/**
 * Atomically claim due outbox rows with a single UPDATE … RETURNING.
 * SKIP LOCKED plus a lease on `processingStartedAt` prevents two workers from
 * returning the same id. Expired leases (`processingStartedAt` older than
 * CLAIM_LEASE_MS) are reclaimed after a crash.
 */
async function claimPendingNotifications(limit: number): Promise<ClaimedNotification[]> {
  const claimed = await prisma.$queryRaw<ClaimedNotification[]>(Prisma.sql`
    WITH picked AS (
      SELECT id
      FROM "Notification"
      WHERE status = CAST('PENDING' AS "NotificationStatus")
        AND (
          "processingStartedAt" IS NULL
          OR "processingStartedAt" <= NOW() - (${CLAIM_LEASE_MS} * INTERVAL '1 millisecond')
        )
        AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= NOW())
        AND "attemptCount" < "maxAttempts"
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "Notification" AS n
    SET
      "processingStartedAt" = NOW(),
      "nextRetryAt" = NOW() + (${CLAIM_LEASE_MS} * INTERVAL '1 millisecond')
    FROM picked
    WHERE n.id = picked.id
      AND n.status = CAST('PENDING' AS "NotificationStatus")
      AND (
        n."processingStartedAt" IS NULL
        OR n."processingStartedAt" <= NOW() - (${CLAIM_LEASE_MS} * INTERVAL '1 millisecond')
      )
    RETURNING
      n.id,
      n."tenantId",
      n."recipientUserId",
      n.channel,
      n.status,
      n."attemptCount",
      n."maxAttempts"
  `);

  return claimed;
}

export async function processNotificationOutbox(
  limit = 25
): Promise<{ processed: number; sent: number; failed: number }> {
  const claimedItems = await claimPendingNotifications(limit);
  let sent = 0;
  let failed = 0;

  for (const current of claimedItems) {
    if (current.status !== NotificationStatus.PENDING) {
      continue;
    }

    if (current.attemptCount >= current.maxAttempts) {
      await prisma.notification.updateMany({
        where: { id: current.id, status: NotificationStatus.PENDING },
        data: {
          status: NotificationStatus.FAILED,
          lastError: 'max_attempts_exceeded',
          nextRetryAt: null,
          completedAt: new Date(),
        },
      });
      failed += 1;
      continue;
    }

    // Compare-and-swap: only the worker that wins this version increment may send.
    const lock = await prisma.notification.updateMany({
      where: {
        id: current.id,
        status: NotificationStatus.PENDING,
        attemptCount: current.attemptCount,
        processingStartedAt: { not: null },
      },
      data: {
        attemptCount: { increment: 1 },
      },
    });
    if (lock.count !== 1) {
      continue;
    }

    const recipient = await prisma.user.findFirst({
      where: { id: current.recipientUserId, tenantId: current.tenantId },
      select: {
        email: true,
        patientProfile: { select: { phoneNumber: true } },
      },
    });

    const result = await sendViaProvider(current.channel, current.id, {
      email: recipient?.email,
      phone: recipient?.patientProfile?.phoneNumber,
    });

    if (result.success) {
      const updated = await prisma.notification.updateMany({
        where: { id: current.id, status: NotificationStatus.PENDING },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          completedAt: new Date(),
          nextRetryAt: null,
          lastError: null,
        },
      });
      if (updated.count === 1) {
        sent += 1;
      }
      continue;
    }

    const nextAttempt = current.attemptCount + 1;
    const backoff = BACKOFF_MS[Math.min(nextAttempt - 1, BACKOFF_MS.length - 1)];
    const exhausted = nextAttempt >= current.maxAttempts;
    const lastError = result.reason || result.error || 'PROVIDER_REJECTED';

    // Schedule retries with PostgreSQL NOW() so session time zone cannot treat a
    // UTC Date written into a timestamp-without-time-zone column as already due.
    await prisma.$executeRaw(
      exhausted
        ? Prisma.sql`
            UPDATE "Notification"
            SET
              status = CAST('FAILED' AS "NotificationStatus"),
              "nextRetryAt" = NULL,
              "lastError" = ${lastError},
              "completedAt" = NOW(),
              "processingStartedAt" = NOW()
            WHERE id = ${current.id}::uuid
              AND status = CAST('PENDING' AS "NotificationStatus")
          `
        : Prisma.sql`
            UPDATE "Notification"
            SET
              status = CAST('PENDING' AS "NotificationStatus"),
              "nextRetryAt" = NOW() + (${backoff} * INTERVAL '1 millisecond'),
              "lastError" = ${lastError},
              "completedAt" = NULL,
              "processingStartedAt" = NULL
            WHERE id = ${current.id}::uuid
              AND status = CAST('PENDING' AS "NotificationStatus")
          `
    );

    if (exhausted) {
      failed += 1;
    }

    logger.info(
      { event: 'notification.retry', tenantId: current.tenantId, channel: current.channel },
      'Notification delivery deferred'
    );
  }

  return { processed: claimedItems.length, sent, failed };
}
