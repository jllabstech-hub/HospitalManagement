import { createHash, randomInt, randomUUID } from 'node:crypto';
import { prisma } from '@/server/db/client';
import { DomainError } from '@/server/errors/domain-error';
import { getAuthSecret } from '@/server/security/auth-secret';
import { assertRateLimit, recordAuthAttempt } from '@/server/security/rate-limit';
import { logger } from '@/lib/logger';

const OTP_TTL_MS = 8 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '').trim();
}

export function hashOtp(tenantId: string, phone: string, otp: string): string {
  return createHash('sha256')
    .update(`${getAuthSecret()}:${tenantId}:${phone}:${otp}`)
    .digest('hex');
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function isOtpDemoMode(): boolean {
  return process.env.OTP_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
}

export async function issueOtpChallenge(input: {
  tenantId: string;
  phone: string;
  ipAddress?: string | null;
}): Promise<{ expiresAt: Date; demoMode: boolean }> {
  const phone = normalizePhone(input.phone);
  if (phone.replace(/\D/g, '').length < 10) {
    throw new DomainError('VALIDATION_ERROR', 'Please enter a valid 10-digit phone number.');
  }

  await assertRateLimit({
    kind: 'OTP_SEND',
    key: `otp:${input.tenantId}:${phone}`,
    tenantId: input.tenantId,
  });

  const recent = await prisma.otpChallenge.findFirst({
    where: {
      tenantId: input.tenantId,
      phone,
      createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (recent && !recent.consumedAt) {
    throw new DomainError(
      'RATE_LIMITED',
      'Please wait before requesting another verification code.',
      undefined,
      429
    );
  }

  const otp = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.create({
    data: {
      id: randomUUID(),
      tenantId: input.tenantId,
      phone,
      codeHash: hashOtp(input.tenantId, phone, otp),
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
      ipAddress: input.ipAddress ?? null,
    },
  });

  await recordAuthAttempt({
    kind: 'OTP_SEND',
    key: `otp:${input.tenantId}:${phone}`,
    tenantId: input.tenantId,
    success: true,
  });

  logger.info({ tenantId: input.tenantId, event: 'otp.issued' }, 'OTP challenge created');

  const demoMode = isOtpDemoMode();
  if (demoMode) {
    // Intentionally do not include the OTP in logs or returned payloads.
    logger.info({ event: 'otp.demo_mode' }, 'OTP demo mode enabled; SMS not dispatched');
  }

  return { expiresAt, demoMode };
}

export async function verifyOtpChallenge(input: {
  tenantId: string;
  phone: string;
  otp: string;
  ipAddress?: string | null;
}): Promise<void> {
  const phone = normalizePhone(input.phone);
  const otp = (input.otp || '').trim();

  await assertRateLimit({
    kind: 'OTP_VERIFY',
    key: `otp-verify:${input.tenantId}:${phone}`,
    tenantId: input.tenantId,
  });

  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      tenantId: input.tenantId,
      phone,
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    await recordAuthAttempt({
      kind: 'OTP_VERIFY',
      key: `otp-verify:${input.tenantId}:${phone}`,
      tenantId: input.tenantId,
      success: false,
    });
    throw new DomainError('UNAUTHORIZED', 'Invalid or expired verification code.', undefined, 401);
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await recordAuthAttempt({
      kind: 'OTP_VERIFY',
      key: `otp-verify:${input.tenantId}:${phone}`,
      tenantId: input.tenantId,
      success: false,
    });
    throw new DomainError('UNAUTHORIZED', 'Invalid or expired verification code.', undefined, 401);
  }

  if (challenge.attemptCount >= challenge.maxAttempts) {
    await recordAuthAttempt({
      kind: 'OTP_VERIFY',
      key: `otp-verify:${input.tenantId}:${phone}`,
      tenantId: input.tenantId,
      success: false,
    });
    throw new DomainError('RATE_LIMITED', 'Too many verification attempts.', undefined, 429);
  }

  const expectedHash = hashOtp(input.tenantId, phone, otp);
  const matches = expectedHash === challenge.codeHash;

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: {
      attemptCount: { increment: 1 },
      consumedAt: matches ? new Date() : undefined,
    },
  });

  await recordAuthAttempt({
    kind: 'OTP_VERIFY',
    key: `otp-verify:${input.tenantId}:${phone}`,
    tenantId: input.tenantId,
    success: matches,
  });

  if (!matches) {
    throw new DomainError('UNAUTHORIZED', 'Invalid or expired verification code.', undefined, 401);
  }
}

export const otpInternals = {
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
};
