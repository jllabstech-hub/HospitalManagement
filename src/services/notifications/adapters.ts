import { redactEmail, redactPhone } from '@/lib/pii-redact';
import { sendViaProvider } from '@/server/notifications/providers';
import { NotificationChannel } from '@prisma/client';

export interface NotificationPayload {
  recipientId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  appointmentId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AdapterResult {
  success: boolean;
  reason?: 'PROVIDER_NOT_CONFIGURED' | 'PROVIDER_REJECTED' | 'UNSUPPORTED_CHANNEL';
  error: string | null;
}

export interface NotificationAdapter {
  send(payload: NotificationPayload): Promise<AdapterResult>;
}

export class EmailAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<AdapterResult> {
    void redactEmail(payload.recipientEmail);
    return sendViaProvider(NotificationChannel.EMAIL, payload.appointmentId || payload.recipientId, {
      email: payload.recipientEmail,
    });
  }
}

export class SmsAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<AdapterResult> {
    void redactPhone(payload.recipientPhone);
    return sendViaProvider(NotificationChannel.SMS, payload.appointmentId || payload.recipientId, {
      phone: payload.recipientPhone,
    });
  }
}

export class WhatsAppAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<AdapterResult> {
    void redactPhone(payload.recipientPhone);
    return sendViaProvider(NotificationChannel.WHATSAPP, payload.appointmentId || payload.recipientId, {
      phone: payload.recipientPhone,
    });
  }
}

export class PushAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<AdapterResult> {
    return sendViaProvider(NotificationChannel.PUSH, payload.appointmentId || payload.recipientId);
  }
}
