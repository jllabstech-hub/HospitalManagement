import { randomUUID } from 'node:crypto';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { logger } from '@/lib/logger';

export async function enqueueAppointmentNotification(input: {
  tenantId: string;
  type: NotificationType;
  recipientUserId: string;
  appointmentId: string;
}): Promise<void> {
  const channels: NotificationChannel[] = [NotificationChannel.EMAIL, NotificationChannel.SMS];

  for (const channel of channels) {
    const idempotencyKey = `${input.tenantId}:${input.appointmentId}:${input.type}:${channel}`;
    try {
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          tenantId: input.tenantId,
          recipientUserId: input.recipientUserId,
          appointmentId: input.appointmentId,
          type: input.type,
          channel,
          status: NotificationStatus.PENDING,
          idempotencyKey,
          attemptCount: 0,
          maxAttempts: 8,
          nextRetryAt: new Date(),
          payload: { type: input.type, channel },
        },
      });
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (code === 'P2002') {
        continue;
      }
      logger.error({ event: 'notification.enqueue_failed', tenantId: input.tenantId }, 'Failed to enqueue notification');
    }
  }
}
