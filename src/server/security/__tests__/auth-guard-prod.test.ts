import { describe, it, expect } from 'vitest';
import { validateProductionConfig } from '@/server/config/config-validation';
import { allowMockSessionFallback, isTestRuntime } from '@/server/tenant/types';

function withProductionEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  const keys = [
    'NODE_ENV',
    'AUTH_SECRET',
    'DATABASE_URL',
    'MEDIA_BUCKET',
    'METRICS_TOKEN',
    'NEXTAUTH_URL',
    'RESEND_API_KEY',
    'ALLOW_DESTRUCTIVE_SEED',
    'ALLOW_DEV_TENANT_FALLBACK',
    'E2E_TEST_MODE',
    'ALLOW_MOCK_SESSION',
    'OTP_DEMO_MODE',
    'SHOW_DEMO_CREDENTIALS',
    'RATE_LIMIT_DISABLED',
    'STORAGE_PROVIDER',
  ];
  const snapshot: Record<string, string | undefined> = {};
  for (const key of keys) snapshot[key] = process.env[key];
  try {
    // @ts-expect-error mutating NODE_ENV
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SECRET = 'production-auth-secret-key-min-32-chars';
    process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
    process.env.MEDIA_BUCKET = 'production-media-bucket';
    process.env.METRICS_TOKEN = 'metrics-token-123';
    process.env.NEXTAUTH_URL = 'https://hospital.example';
    process.env.RESEND_API_KEY = 're_test';
    delete process.env.ALLOW_DESTRUCTIVE_SEED;
    delete process.env.ALLOW_DEV_TENANT_FALLBACK;
    delete process.env.E2E_TEST_MODE;
    delete process.env.ALLOW_MOCK_SESSION;
    delete process.env.OTP_DEMO_MODE;
    delete process.env.SHOW_DEMO_CREDENTIALS;
    delete process.env.RATE_LIMIT_DISABLED;
    delete process.env.STORAGE_PROVIDER;
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fn();
  } finally {
    for (const key of keys) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  }
}

describe('Production Auth & Config Guard Tests', () => {
  it('rejects dangerous production environment flags', () => {
    withProductionEnv({ ALLOW_DESTRUCTIVE_SEED: 'true' }, () => {
      expect(() => validateProductionConfig()).toThrow(
        'ALLOW_DESTRUCTIVE_SEED is strictly forbidden in production'
      );
    });
  });

  it('rejects production runtime without MEDIA_BUCKET', () => {
    withProductionEnv({ MEDIA_BUCKET: undefined }, () => {
      expect(() => validateProductionConfig()).toThrow('MEDIA_BUCKET is missing');
    });
  });

  it('rejects E2E_TEST_MODE, mock sessions, and demo auth in production', () => {
    withProductionEnv({ E2E_TEST_MODE: 'true' }, () => {
      expect(() => validateProductionConfig()).toThrow('E2E_TEST_MODE is strictly forbidden');
    });
    withProductionEnv({ ALLOW_MOCK_SESSION: 'true' }, () => {
      expect(() => validateProductionConfig()).toThrow('ALLOW_MOCK_SESSION is strictly forbidden');
    });
    withProductionEnv({ OTP_DEMO_MODE: 'true' }, () => {
      expect(() => validateProductionConfig()).toThrow('OTP_DEMO_MODE is strictly forbidden');
    });
    withProductionEnv({ SHOW_DEMO_CREDENTIALS: 'true' }, () => {
      expect(() => validateProductionConfig()).toThrow('SHOW_DEMO_CREDENTIALS is strictly forbidden');
    });
  });

  it('cannot activate mock session fallback in production', () => {
    const origEnv = process.env.NODE_ENV;
    const origE2e = process.env.E2E_TEST_MODE;
    const origMock = process.env.ALLOW_MOCK_SESSION;
    try {
      // @ts-expect-error mutating NODE_ENV
      process.env.NODE_ENV = 'production';
      process.env.E2E_TEST_MODE = 'true';
      process.env.ALLOW_MOCK_SESSION = 'true';
      expect(isTestRuntime()).toBe(false);
      expect(allowMockSessionFallback()).toBe(false);
    } finally {
      // @ts-expect-error restoring NODE_ENV
      process.env.NODE_ENV = origEnv;
      process.env.E2E_TEST_MODE = origE2e;
      process.env.ALLOW_MOCK_SESSION = origMock;
    }
  });
});
