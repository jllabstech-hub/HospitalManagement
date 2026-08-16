import { DomainError } from '@/server/errors/domain-error';

const WEAK_SECRETS = new Set([
  '',
  'secret',
  'changeme',
  'your-super-secret-jwt-key-min-32-chars-change-in-production',
]);

function hasNotificationCredentials(): boolean {
  const email = Boolean(process.env.RESEND_API_KEY);
  const sms = Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER
  );
  return email || sms;
}

function hasAppUrl(): boolean {
  return Boolean(
    process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL
  );
}

function applyVercelAppUrlFallback(): void {
  if (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    !process.env.VERCEL_URL
  ) {
    return;
  }
  const host = process.env.VERCEL_URL.replace(/^https?:\/\//, '');
  const url = `https://${host}`;
  process.env.NEXTAUTH_URL = url;
  process.env.AUTH_URL = url;
}

/**
 * Production environment startup auditor.
 * Validates required secrets and rejects dangerous flags.
 */
export function validateProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  applyVercelAppUrlFallback();

  const errors: string[] = [];
  const warnings: string[] = [];

  const authSecret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  if (!authSecret || authSecret.length < 32 || WEAK_SECRETS.has(authSecret)) {
    errors.push('AUTH_SECRET (or NEXTAUTH_SECRET) must be a unique value of at least 32 characters.');
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is missing.');
  }

  if (!hasAppUrl()) {
    errors.push('NEXTAUTH_URL, AUTH_URL, NEXT_PUBLIC_APP_URL, or VERCEL_URL is missing.');
  }

  if (!process.env.MEDIA_BUCKET) {
    warnings.push('MEDIA_BUCKET is missing; media uploads will stay disabled until object storage is configured.');
  }

  if (!process.env.METRICS_TOKEN) {
    warnings.push('METRICS_TOKEN is missing; the metrics endpoint will stay unauthorized.');
  }

  if (!hasNotificationCredentials()) {
    warnings.push('Notification provider credentials are missing (configure Resend and/or Twilio when email/SMS is needed).');
  }

  if (process.env.ALLOW_DESTRUCTIVE_SEED === 'true') {
    errors.push('ALLOW_DESTRUCTIVE_SEED is strictly forbidden in production.');
  }

  if (process.env.ALLOW_DEV_TENANT_FALLBACK === 'true') {
    errors.push('ALLOW_DEV_TENANT_FALLBACK is strictly forbidden in production.');
  }

  if (process.env.E2E_TEST_MODE === 'true') {
    errors.push('E2E_TEST_MODE is strictly forbidden in production.');
  }

  if (process.env.ALLOW_MOCK_SESSION === 'true') {
    errors.push('ALLOW_MOCK_SESSION is strictly forbidden in production.');
  }

  if (process.env.OTP_DEMO_MODE === 'true') {
    errors.push('OTP_DEMO_MODE is strictly forbidden in production.');
  }

  if (process.env.SHOW_DEMO_CREDENTIALS === 'true') {
    errors.push('SHOW_DEMO_CREDENTIALS is strictly forbidden in production.');
  }

  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    errors.push('RATE_LIMIT_DISABLED is strictly forbidden in production.');
  }

  if (process.env.STORAGE_PROVIDER === 'local') {
    errors.push('STORAGE_PROVIDER=local is strictly forbidden in production.');
  }

  if (warnings.length > 0) {
    console.warn(
      `[PRODUCTION CONFIG WARNING] Optional services are not fully configured:\n- ${warnings.join('\n- ')}`
    );
  }

  if (errors.length > 0) {
    const message = `[FATAL PRODUCTION CONFIG ERROR] Production configuration audit failed:\n- ${errors.join('\n- ')}`;
    console.error(message);
    throw new DomainError('PRODUCTION_CONFIG_INVALID', message, undefined, 500);
  }
}
