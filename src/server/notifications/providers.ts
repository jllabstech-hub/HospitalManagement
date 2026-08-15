import { NotificationChannel } from '@prisma/client';
import { logger } from '@/lib/logger';

export type ProviderFailureReason =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_REJECTED'
  | 'UNSUPPORTED_CHANNEL';

export interface ProviderResult {
  success: boolean;
  reason?: ProviderFailureReason;
  error: string | null;
}

export interface NotificationRecipient {
  email?: string | null;
  phone?: string | null;
}

function hasEmailProvider(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function hasSmsProvider(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

async function sendEmail(notificationId: string, recipient: NotificationRecipient): Promise<ProviderResult> {
  if (!hasEmailProvider()) {
    return { success: false, reason: 'PROVIDER_NOT_CONFIGURED', error: 'PROVIDER_NOT_CONFIGURED' };
  }
  if (!recipient.email) {
    return { success: false, reason: 'PROVIDER_REJECTED', error: 'missing_recipient_email' };
  }

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NOTIFICATION_FROM_EMAIL || 'noreply@example.com',
        to: [recipient.email],
        subject: 'Hospital appointment notification',
        text: 'An appointment update is available in your patient portal.',
      }),
    });
    if (!response.ok) {
      return { success: false, reason: 'PROVIDER_REJECTED', error: `resend_${response.status}` };
    }
    logger.info({ event: 'notification.email.dispatch', notificationId }, 'Email accepted by provider');
    return { success: true, error: null };
  }

  return { success: false, reason: 'PROVIDER_NOT_CONFIGURED', error: 'PROVIDER_NOT_CONFIGURED' };
}

async function sendSms(notificationId: string, recipient: NotificationRecipient): Promise<ProviderResult> {
  if (!hasSmsProvider()) {
    return { success: false, reason: 'PROVIDER_NOT_CONFIGURED', error: 'PROVIDER_NOT_CONFIGURED' };
  }
  if (!recipient.phone) {
    return { success: false, reason: 'PROVIDER_REJECTED', error: 'missing_recipient_phone' };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER as string;
  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: recipient.phone,
        From: fromPhone,
        Body: 'A hospital appointment update is available in the patient portal.',
      }).toString(),
    }
  );

  if (!response.ok) {
    return { success: false, reason: 'PROVIDER_REJECTED', error: `twilio_${response.status}` };
  }

  logger.info({ event: 'notification.sms.dispatch', notificationId }, 'SMS accepted by provider');
  return { success: true, error: null };
}

/**
 * Production adapters never report success unless the provider confirms acceptance.
 */
export async function sendViaProvider(
  channel: NotificationChannel,
  notificationId: string,
  recipient: NotificationRecipient = {}
): Promise<ProviderResult> {
  if (channel === NotificationChannel.EMAIL) {
    return sendEmail(notificationId, recipient);
  }

  if (channel === NotificationChannel.SMS || channel === NotificationChannel.WHATSAPP) {
    return sendSms(notificationId, recipient);
  }

  if (channel === NotificationChannel.PUSH) {
    if (!process.env.PUSH_PROVIDER_KEY || !process.env.PUSH_PROVIDER_URL) {
      return { success: false, reason: 'PROVIDER_NOT_CONFIGURED', error: 'PROVIDER_NOT_CONFIGURED' };
    }
    const response = await fetch(process.env.PUSH_PROVIDER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PUSH_PROVIDER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId }),
    });
    if (!response.ok) {
      return { success: false, reason: 'PROVIDER_REJECTED', error: `push_${response.status}` };
    }
    return { success: true, error: null };
  }

  return { success: false, reason: 'UNSUPPORTED_CHANNEL', error: 'UNSUPPORTED_CHANNEL' };
}
