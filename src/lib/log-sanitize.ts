import { redactEmail, redactName, redactPhone } from '@/lib/pii-redact';

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /\+?\d[\d\s-]{8,}\d/g;

export function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(EMAIL_RE, (match) => redactEmail(match))
      .replace(PHONE_RE, (match) => redactPhone(match.replace(/\s+/g, '')));
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeLogValue);
  }
  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(input)) {
      const lowered = key.toLowerCase();
      if (['phone', 'recipientphone', 'phonenumber'].includes(lowered)) {
        output[key] = redactPhone(typeof nested === 'string' ? nested : null);
      } else if (['email', 'recipientemail'].includes(lowered)) {
        output[key] = redactEmail(typeof nested === 'string' ? nested : null);
      } else if (['fullname', 'patientname', 'recipientname', 'name'].includes(lowered)) {
        output[key] = redactName(typeof nested === 'string' ? nested : null);
      } else if (['otp', 'code', 'password', 'passwordhash', 'reason', 'message', 'payload'].includes(lowered)) {
        output[key] = '[redacted]';
      } else {
        output[key] = sanitizeLogValue(nested);
      }
    }
    return output;
  }
  return value;
}
