import { prisma } from '@/server/db/client';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import {
  NotificationPayload,
  NotificationAdapter,
  EmailAdapter,
  SmsAdapter,
  WhatsAppAdapter,
  PushAdapter,
} from './adapters';

export class NotificationService {
  private adapters: Record<NotificationChannel, NotificationAdapter>;

  constructor() {
    this.adapters = {
      [NotificationChannel.EMAIL]: new EmailAdapter(),
      [NotificationChannel.SMS]: new SmsAdapter(),
      [NotificationChannel.WHATSAPP]: new WhatsAppAdapter(),
      [NotificationChannel.PUSH]: new PushAdapter(),
    };
  }

  /**
   * Dispatches a notification to the specified channels and logs it in the database.
   */
  async dispatch(
    tenantId: string | null,
    type: NotificationType,
    channels: NotificationChannel[],
    payload: NotificationPayload
  ): Promise<void> {
    for (const channel of channels) {
      const adapter = this.adapters[channel];
      if (!adapter) {
        console.warn(`[NotificationService] No adapter found for channel ${channel}`);
        continue;
      }

      // Create notification record as PENDING
      const notificationRecord = await prisma.notification.create({
        data: {
          tenantId,
          recipientUserId: payload.recipientId,
          appointmentId: payload.appointmentId,
          type,
          channel,
          status: NotificationStatus.PENDING,
          payload: payload.metadata || {},
        },
      });

      try {
        const success = await adapter.send(payload);

        // Update record to SENT or FAILED
        await prisma.notification.update({
          where: { id: notificationRecord.id },
          data: {
            status: success ? NotificationStatus.SENT : NotificationStatus.FAILED,
            sentAt: success ? new Date() : null,
          },
        });
      } catch (error) {
        console.error(`[NotificationService] Error sending ${channel} notification:`, error);
        await prisma.notification.update({
          where: { id: notificationRecord.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
      }
    }
  }

  // Pre-defined workflows

  async notifyAppointmentBooked(
    tenantId: string | null,
    patientId: string,
    appointmentId: string,
    patientName: string,
    doctorName: string,
    dateTimeString: string,
    email?: string,
    phone?: string
  ) {
    const payload: NotificationPayload = {
      recipientId: patientId,
      recipientName: patientName,
      recipientEmail: email,
      recipientPhone: phone,
      appointmentId,
      message: `Dear ${patientName}, your appointment with ${doctorName} on ${dateTimeString} has been successfully booked.`,
    };

    const channels: NotificationChannel[] = [];
    if (email) channels.push(NotificationChannel.EMAIL);
    if (phone) channels.push(NotificationChannel.SMS);
    // Assuming Push is always available via the app
    channels.push(NotificationChannel.PUSH);

    await this.dispatch(tenantId, NotificationType.APPOINTMENT_BOOKED, channels, payload);
  }

  async notifyAppointmentConfirmed(
    tenantId: string | null,
    patientId: string,
    appointmentId: string,
    patientName: string,
    doctorName: string,
    dateTimeString: string,
    email?: string,
    phone?: string
  ) {
    const payload: NotificationPayload = {
      recipientId: patientId,
      recipientName: patientName,
      recipientEmail: email,
      recipientPhone: phone,
      appointmentId,
      message: `Dear ${patientName}, your appointment with ${doctorName} on ${dateTimeString} has been confirmed.`,
    };

    const channels: NotificationChannel[] = [];
    if (email) channels.push(NotificationChannel.EMAIL);
    if (phone) channels.push(NotificationChannel.SMS);
    channels.push(NotificationChannel.PUSH);

    await this.dispatch(tenantId, NotificationType.APPOINTMENT_CONFIRMED, channels, payload);
  }

  async notifyAppointmentCancelled(
    tenantId: string | null,
    patientId: string,
    appointmentId: string,
    patientName: string,
    doctorName: string,
    dateTimeString: string,
    reason: string,
    email?: string,
    phone?: string
  ) {
    const payload: NotificationPayload = {
      recipientId: patientId,
      recipientName: patientName,
      recipientEmail: email,
      recipientPhone: phone,
      appointmentId,
      message: `Dear ${patientName}, your appointment with ${doctorName} on ${dateTimeString} has been cancelled. Reason: ${reason}.`,
    };

    const channels: NotificationChannel[] = [];
    if (email) channels.push(NotificationChannel.EMAIL);
    if (phone) channels.push(NotificationChannel.SMS);
    channels.push(NotificationChannel.PUSH);

    await this.dispatch(tenantId, NotificationType.APPOINTMENT_CANCELLED, channels, payload);
  }
}

export const notificationService = new NotificationService();
