import { DomainError } from '@/server/errors/domain-error';

const NEON_HOST_RE = /\.neon\.tech|neon\.build/i;

export function isForbiddenSharedDatabaseUrl(url: string): boolean {
  if (!url) return false;
  if (NEON_HOST_RE.test(url)) return true;
  const productionUrl = process.env.PRODUCTION_DATABASE_URL;
  return Boolean(productionUrl && url === productionUrl);
}

/**
 * Fails immediately when unit/E2E tests would mutate the shared Neon database.
 */
export function assertDatabaseIsolation(): void {
  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;
  const isE2eMode = process.env.E2E_TEST_MODE === 'true';
  const isTestOrE2e = nodeEnv === 'test' || isE2eMode;

  if (!isTestOrE2e) {
    return;
  }

  if (isForbiddenSharedDatabaseUrl(dbUrl)) {
    const host = dbUrl.split('@').pop() || dbUrl;
    const errorMsg =
      `[FATAL DATABASE GUARD ERROR] Test/E2E execution attempted against production/shared Neon (${host}). ` +
      `Provide UNIT_TEST_DATABASE_URL or E2E_DATABASE_URL pointing at an isolated PostgreSQL database.`;
    console.error(errorMsg);
    throw new DomainError('DATABASE_GUARD_VIOLATION', errorMsg, undefined, 500);
  }
}
