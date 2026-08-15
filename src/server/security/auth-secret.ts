const WEAK_SECRETS = new Set([
  'dev-super-secret-key-min-32-chars-change-in-prod',
  'your-super-secret-jwt-key-min-32-chars-change-in-production',
  'changeme',
  'secret',
]);

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getAuthSecret(): string {
  const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

  if (isProductionRuntime() && !isBuild) {
    if (!secret || secret.length < 32 || WEAK_SECRETS.has(secret)) {
      throw new Error(
        'AUTH_SECRET must be set to a strong unique value of at least 32 characters in production.'
      );
    }
    return secret;
  }

  if (secret && secret.length >= 32 && !WEAK_SECRETS.has(secret)) {
    return secret;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test-auth-secret-key-min-32-chars-not-for-prod';
  }

  // Development only. Production never reaches this branch.
  return 'dev-only-local-secret-min-32-chars!!';
}

export function assertProductionAuthSecret(): void {
  if (!isProductionRuntime()) return;
  getAuthSecret();
}
