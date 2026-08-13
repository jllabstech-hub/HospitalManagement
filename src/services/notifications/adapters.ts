export interface NotificationPayload {
  recipientId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  appointmentId?: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

export interface NotificationAdapter {
  send(payload: NotificationPayload): Promise<boolean>;
}

export class EmailAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[EmailAdapter] Sending email to ${payload.recipientEmail}...`);
    console.log(`[EmailAdapter] Message: ${payload.message}`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true; // Always return true for now since we don't have production credentials
  }
}

export class SmsAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[SmsAdapter] Sending SMS to ${payload.recipientPhone}...`);
    console.log(`[SmsAdapter] Message: ${payload.message}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
}

export class WhatsAppAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[WhatsAppAdapter] Sending WhatsApp message to ${payload.recipientPhone}...`);
    console.log(`[WhatsAppAdapter] Message: ${payload.message}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
}

export class PushAdapter implements NotificationAdapter {
  async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[PushAdapter] Sending push notification to User ${payload.recipientId}...`);
    console.log(`[PushAdapter] Message: ${payload.message}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
}
