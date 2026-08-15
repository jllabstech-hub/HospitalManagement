import { describe, it, expect, beforeEach } from 'vitest';
import {
  assertRateLimit,
  isRateLimitingEnabled,
  recordAuthAttempt,
  resetAuthAttemptsForTest,
} from '../rate-limit';

describe('Rate Limit Production Security Tests', () => {
  const testKey = 'test-prod-guard-' + Date.now();

  beforeEach(async () => {
    if (process.env.NODE_ENV !== 'production') {
      await resetAuthAttemptsForTest(testKey);
    }
  });

  it('enforces rate limits when failed attempts reach threshold', async () => {
    for (let i = 0; i < 5; i++) {
      await recordAuthAttempt({ kind: 'LOGIN', key: testKey, success: false });
    }

    await expect(assertRateLimit({ kind: 'LOGIN', key: testKey })).rejects.toThrow(
      'Too many attempts. Please try again later.'
    );
  });

  it('cannot disable the rate limiter in production via RATE_LIMIT_DISABLED', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalFlag = process.env.RATE_LIMIT_DISABLED;
    try {
      // @ts-expect-error mutating readonly NODE_ENV for test assertion
      process.env.NODE_ENV = 'production';
      process.env.RATE_LIMIT_DISABLED = 'true';
      expect(isRateLimitingEnabled()).toBe(true);
      for (let i = 0; i < 5; i++) {
        await recordAuthAttempt({ kind: 'LOGIN', key: testKey, success: false });
      }
      await expect(assertRateLimit({ kind: 'LOGIN', key: testKey })).rejects.toThrow(
        'Too many attempts. Please try again later.'
      );
    } finally {
      // @ts-expect-error restoring original NODE_ENV
      process.env.NODE_ENV = originalEnv;
      process.env.RATE_LIMIT_DISABLED = originalFlag;
    }
  });

  it('blocks resetAuthAttemptsForTest in production runtime', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      // @ts-expect-error mutating readonly NODE_ENV for test assertion
      process.env.NODE_ENV = 'production';
      await expect(resetAuthAttemptsForTest(testKey)).rejects.toThrow(
        'resetAuthAttemptsForTest cannot be invoked in production.'
      );
    } finally {
      // @ts-expect-error restoring original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    }
  });
});
