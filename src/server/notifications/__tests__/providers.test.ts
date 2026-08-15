import { describe, it, expect } from 'vitest';
import { sendViaProvider } from '../providers';
import { NotificationChannel } from '@prisma/client';

describe('Notification providers never fake success', () => {
  it('returns PROVIDER_NOT_CONFIGURED when email credentials are missing', async () => {
    const origResend = process.env.RESEND_API_KEY;
    const origHost = process.env.SMTP_HOST;
    const origUser = process.env.SMTP_USER;
    const origPass = process.env.SMTP_PASS;
    try {
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      const result = await sendViaProvider(NotificationChannel.EMAIL, 'notif-1', { email: 'a@b.com' });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('PROVIDER_NOT_CONFIGURED');
    } finally {
      process.env.RESEND_API_KEY = origResend;
      process.env.SMTP_HOST = origHost;
      process.env.SMTP_USER = origUser;
      process.env.SMTP_PASS = origPass;
    }
  });

  it('returns PROVIDER_NOT_CONFIGURED when SMS credentials are missing', async () => {
    const origSid = process.env.TWILIO_ACCOUNT_SID;
    const origToken = process.env.TWILIO_AUTH_TOKEN;
    const origFrom = process.env.TWILIO_PHONE_NUMBER;
    try {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_PHONE_NUMBER;
      const result = await sendViaProvider(NotificationChannel.SMS, 'notif-2', { phone: '+919876543210' });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('PROVIDER_NOT_CONFIGURED');
    } finally {
      process.env.TWILIO_ACCOUNT_SID = origSid;
      process.env.TWILIO_AUTH_TOKEN = origToken;
      process.env.TWILIO_PHONE_NUMBER = origFrom;
    }
  });
});
