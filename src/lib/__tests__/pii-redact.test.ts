import { describe, it, expect } from 'vitest';
import { redactPhone, redactEmail, redactName } from '../pii-redact';

describe('PII Redaction Tests', () => {
  it('redacts phone numbers while preserving format and end digits', () => {
    expect(redactPhone('+919876543210')).toBe('+91******3210');
    expect(redactPhone('9876543210')).toBe('987***3210');
    expect(redactPhone(null)).toBe('[REDACTED_PHONE]');
  });

  it('redacts email addresses while preserving domain', () => {
    expect(redactEmail('alice@example.com')).toBe('a***e@example.com');
    expect(redactEmail('patient.bob@hospital.org')).toBe('p*********b@hospital.org');
    expect(redactEmail(null)).toBe('[REDACTED_EMAIL]');
  });

  it('redacts patient names', () => {
    expect(redactName('John Doe')).toBe('J*** D**');
    expect(redactName('Alice Smith')).toBe('A**** S****');
    expect(redactName(null)).toBe('[REDACTED_NAME]');
  });
});
