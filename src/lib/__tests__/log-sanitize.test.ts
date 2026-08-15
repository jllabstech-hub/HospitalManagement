import { describe, it, expect } from 'vitest';
import { sanitizeLogValue } from '../log-sanitize';

describe('Log sanitization', () => {
  it('redacts phone, email, name, and medical reason fields', () => {
    const sanitized = sanitizeLogValue({
      phone: '+919876543210',
      email: 'alice@example.com',
      patientName: 'Jane Smith',
      reason: 'chest pain follow-up',
      message: 'Dear Jane, appointment at 10:00',
      nested: { recipientPhone: '+919876543210' },
    }) as Record<string, unknown>;

    expect(sanitized.phone).toBe('+91******3210');
    expect(sanitized.email).toBe('a***e@example.com');
    expect(String(sanitized.patientName)).toContain('*');
    expect(sanitized.reason).toBe('[redacted]');
    expect(sanitized.message).toBe('[redacted]');
    expect((sanitized.nested as Record<string, unknown>).recipientPhone).toBe('+91******3210');
  });

  it('redacts phone and email values inside free-form strings', () => {
    const sanitized = sanitizeLogValue('Contact +919876543210 or alice@example.com');
    expect(String(sanitized)).not.toContain('+919876543210');
    expect(String(sanitized)).not.toContain('alice@example.com');
  });
});
