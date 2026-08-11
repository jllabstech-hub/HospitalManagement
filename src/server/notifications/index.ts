import type {
  AppointmentCancellationParams,
  AppointmentConfirmationParams,
  AppointmentReminderParams,
  EnquiryAcknowledgementParams,
  NotificationService,
} from './types';

class NoopNotificationService implements NotificationService {
  async sendAppointmentConfirmation(params: AppointmentConfirmationParams): Promise<void> {
    void params;
  }

  async sendAppointmentCancellation(params: AppointmentCancellationParams): Promise<void> {
    void params;
  }

  async sendAppointmentReminder(params: AppointmentReminderParams): Promise<void> {
    void params;
  }

  async sendEnquiryAcknowledgement(params: EnquiryAcknowledgementParams): Promise<void> {
    void params;
  }
}

export const notificationService: NotificationService = new NoopNotificationService();
