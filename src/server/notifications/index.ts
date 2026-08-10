import type {
  AppointmentCancellationParams,
  AppointmentConfirmationParams,
  AppointmentReminderParams,
  EnquiryAcknowledgementParams,
  NotificationService,
} from './types';

class NoopNotificationService implements NotificationService {
  async sendAppointmentConfirmation(_params: AppointmentConfirmationParams): Promise<void> {}

  async sendAppointmentCancellation(_params: AppointmentCancellationParams): Promise<void> {}

  async sendAppointmentReminder(_params: AppointmentReminderParams): Promise<void> {}

  async sendEnquiryAcknowledgement(_params: EnquiryAcknowledgementParams): Promise<void> {}
}

export const notificationService: NotificationService = new NoopNotificationService();

export { NoopNotificationService };
export type {
  AppointmentCancellationParams,
  AppointmentConfirmationParams,
  AppointmentReminderParams,
  EnquiryAcknowledgementParams,
  NotificationService,
} from './types';
