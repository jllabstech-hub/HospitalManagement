import pino from 'pino';
import { redactEmail, redactPhone } from '@/lib/pii-redact';

const isProduction = process.env.NODE_ENV === 'production';

const REDACT_PATHS = [
  'phone',
  'email',
  'fullName',
  'patientName',
  'recipientPhone',
  'recipientEmail',
  'recipientName',
  'otp',
  'code',
  'password',
  'passwordHash',
  'reason',
  'message',
  'payload',
  '*.phone',
  '*.email',
  '*.fullName',
  '*.patientName',
  '*.otp',
  '*.password',
  '*.passwordHash',
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: REDACT_PATHS,
    censor(value) {
      if (typeof value === 'string' && value.includes('@')) {
        return redactEmail(value);
      }
      if (typeof value === 'string' && /\d{6,}/.test(value)) {
        return redactPhone(value);
      }
      return '[redacted]';
    },
  },
});
