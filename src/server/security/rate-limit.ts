import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/db/client';
import { DomainError } from '@/server/errors/domain-error';

export type AuthAttemptKind = 'LOGIN' | 'OTP_SEND' | 'OTP_VERIFY' | 'PUBLIC_FORM' | 'UPLOAD';

const WINDOWS: Record<AuthAttemptKind, { limit: number; windowMs: number }> = {
  LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },
  OTP_SEND: { limit: 3, windowMs: 15 * 60 * 1000 },
  OTP_VERIFY: { limit: 8, windowMs: 15 * 60 * 1000 },
  PUBLIC_FORM: { limit: 8, windowMs: 15 * 60 * 1000 },
  UPLOAD: { limit: 20, windowMs: 15 * 60 * 1000 },
};

export function isRateLimitingEnabled(): boolean {
  // A global disable switch is never honored, including in tests.
  // Production additionally rejects RATE_LIMIT_DISABLED at startup.
  return true;
}

export async function assertRateLimit(input: {
  kind: AuthAttemptKind;
  key: string;
  tenantId?: string | null;
}): Promise<void> {
  const policy = WINDOWS[input.kind];
  const since = new Date(Date.now() - policy.windowMs);
  const count = await prisma.authAttempt.count({
    where: {
      kind: input.kind,
      key: input.key,
      success: false,
      createdAt: { gte: since },
    },
  });

  if (count >= policy.limit) {
    throw new DomainError(
      'RATE_LIMITED',
      'Too many attempts. Please try again later.',
      'Too many attempts. Please try again later.',
      429
    );
  }
}

export async function recordAuthAttempt(input: {
  kind: AuthAttemptKind;
  key: string;
  tenantId?: string | null;
  success: boolean;
}): Promise<void> {
  await prisma.authAttempt.create({
    data: {
      id: randomUUID(),
      kind: input.kind,
      key: input.key,
      tenantId: input.tenantId ?? null,
      success: input.success,
    },
  });
}

export async function consumeRateLimitedAttempt(input: {
  kind: AuthAttemptKind;
  key: string;
  tenantId?: string | null;
}): Promise<void> {
  await assertRateLimit(input);
}

export async function resetAuthAttemptsForTest(key?: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('resetAuthAttemptsForTest cannot be invoked in production.');
  }
  if (key) {
    await prisma.authAttempt.deleteMany({ where: { key } });
  } else {
    await prisma.authAttempt.deleteMany({});
  }
}
