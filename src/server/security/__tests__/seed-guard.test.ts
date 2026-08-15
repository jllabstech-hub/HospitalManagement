import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getAuthSecret } from '@/server/security/auth-secret';

describe('Seed and build production safety', () => {
  it('does not run prisma db seed during production build', () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.scripts['vercel-build']).not.toMatch(/prisma db seed/);
    expect(pkg.scripts['seed:dev']).toBeDefined();
    expect(pkg.scripts['seed:test']).toBeDefined();
  });

  it('seed source refuses NODE_ENV=production', () => {
    const seed = readFileSync(path.join(process.cwd(), 'prisma/seed.ts'), 'utf8');
    expect(seed).toMatch(/NODE_ENV === 'production'/);
    expect(seed).toMatch(/ALLOW_DESTRUCTIVE_SEED/);
  });

  it('fails closed in production when AUTH_SECRET is missing', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.AUTH_SECRET;
    const originalNext = process.env.NEXTAUTH_SECRET;
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    try {
      expect(() => getAuthSecret()).toThrow(/AUTH_SECRET/);
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSecret) process.env.AUTH_SECRET = originalSecret;
      else delete process.env.AUTH_SECRET;
      if (originalNext) process.env.NEXTAUTH_SECRET = originalNext;
      else delete process.env.NEXTAUTH_SECRET;
    }
  });
});

describe('Seed and build production safety', () => {
  it('does not run prisma db seed during production build', () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.scripts['vercel-build']).not.toMatch(/prisma db seed/);
    expect(pkg.scripts['seed:dev']).toBeDefined();
    expect(pkg.scripts['seed:test']).toBeDefined();
  });

  it('seed source refuses NODE_ENV=production', () => {
    const seed = readFileSync(path.join(process.cwd(), 'prisma/seed.ts'), 'utf8');
    expect(seed).toMatch(/NODE_ENV === 'production'/);
    expect(seed).toMatch(/ALLOW_DESTRUCTIVE_SEED/);
  });
});
