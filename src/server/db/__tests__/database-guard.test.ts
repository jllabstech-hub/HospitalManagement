import { describe, it, expect } from 'vitest';
import { assertDatabaseIsolation, isForbiddenSharedDatabaseUrl } from '../database-guard';

describe('Database isolation guard', () => {
  it('detects Neon hosts as forbidden shared databases', () => {
    expect(isForbiddenSharedDatabaseUrl('postgresql://u:p@ep-x.ap-southeast-1.aws.neon.tech/neondb')).toBe(true);
    expect(isForbiddenSharedDatabaseUrl('postgresql://postgres:postgres@127.0.0.1:5432/hospital_unit')).toBe(false);
  });

  it('fails immediately when tests point at Neon', () => {
    const origEnv = process.env.NODE_ENV;
    const origUrl = process.env.DATABASE_URL;
    const origE2e = process.env.E2E_TEST_MODE;
    try {
      // @ts-expect-error mutating NODE_ENV
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_URL = 'postgresql://u:p@ep-mute.aws.neon.tech/neondb';
      expect(() => assertDatabaseIsolation()).toThrow('FATAL DATABASE GUARD');
    } finally {
      // @ts-expect-error restoring NODE_ENV
      process.env.NODE_ENV = origEnv;
      process.env.DATABASE_URL = origUrl;
      process.env.E2E_TEST_MODE = origE2e;
    }
  });
});
