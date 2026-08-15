import { NotificationType } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { enqueueAppointmentNotification } from './outbox';
import type {
  AppointmentCancellationParams,
  AppointmentConfirmationParams,
  AppointmentReminderParams,
  EnquiryAcknowledgementParams,
  NotificationService,
} from './types';

async function enqueueFromAppointment(
  appointmentId: string,
  type: NotificationType
): Promise<void> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId },
    select: {
      tenantId: true,
      patient: { select: { userId: true } },
    },
  });
  if (!appointment) return;
  await enqueueAppointmentNotification({
    tenantId: appointment.tenantId,
    type,
    recipientUserId: appointment.patient.userId,
    appointmentId,
  });
}

class OutboxNotificationService implements NotificationService {
  async sendAppointmentConfirmation(params: AppointmentConfirmationParams): Promise<void> {
    await enqueueFromAppointment(params.appointmentId, NotificationType.APPOINTMENT_CONFIRMED);
  }

  async sendAppointmentCancellation(params: AppointmentCancellationParams): Promise<void> {
    await enqueueFromAppointment(params.appointmentId, NotificationType.APPOINTMENT_CANCELLED);
  }

  async sendAppointmentReminder(params: AppointmentReminderParams): Promise<void> {
    await enqueueFromAppointment(params.appointmentId, NotificationType.APPOINTMENT_REMINDER);
  }

  async sendEnquiryAcknowledgement(params: EnquiryAcknowledgementParams): Promise<void> {
    void params;
  }
}

export const notificationService: NotificationService = new OutboxNotificationService();
export { processNotificationOutbox } from './worker';
export { enqueueAppointmentNotification } from './outbox';
