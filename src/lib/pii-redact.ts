/**
 * Utility functions for redacting PII (phone, email, patient name) in application logs.
 */

export function redactPhone(phone?: string | null): string {
  if (!phone) return '[REDACTED_PHONE]';
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return '***';
  
  const lastFour = trimmed.slice(-4);
  const prefix = trimmed.slice(0, Math.min(3, trimmed.length - 4));
  return `${prefix}${'*'.repeat(Math.max(3, trimmed.length - prefix.length - 4))}${lastFour}`;
}

export function redactEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '[REDACTED_EMAIL]';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${'*'.repeat(Math.max(2, local.length - 2))}${last}@${domain}`;
}

export function redactName(name?: string | null): string {
  if (!name) return '[REDACTED_NAME]';
  return name
    .split(' ')
    .map((part) => (part.length > 1 ? `${part[0]}${'*'.repeat(part.length - 1)}` : '*'))
    .join(' ');
}
