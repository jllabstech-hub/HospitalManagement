import { prisma } from '@/server/db/client';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { enqueueAppointmentNotification } from '@/server/notifications/outbox';

/**
 * Legacy entry point. All delivery goes through the durable outbox worker.
 * Adapters in this module never mark SENT themselves.
 */
export class NotificationService {
  async dispatch(
    tenantId: string,
    type: NotificationType,
    channels: NotificationChannel[],
    payload: { recipientId: string; appointmentId?: string }
  ): Promise<void> {
    for (const channel of channels) {
      await prisma.notification.create({
        data: {
          tenantId,
          recipientUserId: payload.recipientId,
          appointmentId: payload.appointmentId,
          type,
          channel,
          status: NotificationStatus.PENDING,
          payload: { channel },
          nextRetryAt: new Date(),
        },
      }).catch((error: unknown) => {
        const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
        if (code !== 'P2002') {
          logger.error({ event: 'notification.enqueue_failed', tenantId }, 'Failed to enqueue notification');
        }
      });
    }
  }

  async notifyAppointmentBooked(
    tenantId: string,
    patientUserId: string,
    appointmentId: string
  ): Promise<void> {
    await enqueueAppointmentNotification({
      tenantId,
      type: NotificationType.APPOINTMENT_BOOKED,
      recipientUserId: patientUserId,
      appointmentId,
    });
  }
}

export const notificationService = new NotificationService();
