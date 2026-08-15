#!/usr/bin/env node
/**
 * Provisions isolated PostgreSQL databases for unit tests and Playwright.
 * Never uses the shared/production Neon DATABASE_URL from .env.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_UNIT =
  'postgresql://postgres:postgres@127.0.0.1:5432/hospital_unit?schema=public';
const DEFAULT_E2E =
  'postgresql://postgres:postgres@127.0.0.1:5432/hospital_e2e?schema=public';

function assertNotShared(url, label) {
  const value = url || '';
  const neon = /\.neon\.tech|neon\.build|neon\.tech/i.test(value);
  const production = process.env.PRODUCTION_DATABASE_URL && value === process.env.PRODUCTION_DATABASE_URL;
  if (neon || production) {
    console.error(
      `[FATAL DATABASE GUARD] ${label} points at a shared/production Neon database. ` +
        `Unit and E2E tests must use an isolated PostgreSQL database.`
    );
    process.exit(1);
  }
  if (!value.startsWith('postgres')) {
    console.error(`[FATAL DATABASE GUARD] ${label} is missing or not a postgres URL.`);
    process.exit(1);
  }
}

function databaseNameFromUrl(url) {
  const withoutQuery = url.split('?')[0];
  const pathname = withoutQuery.split('/').pop();
  if (!pathname || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(pathname)) {
    throw new Error(`Cannot derive a safe database name from ${url}`);
  }
  return pathname;
}

function findPsql() {
  const candidates = [
    process.env.PSQL_PATH,
    'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
    'psql',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === 'psql') return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    'psql not found. Install PostgreSQL locally, start Docker Compose (docker-compose.e2e.yml), or set E2E_DATABASE_URL / UNIT_TEST_DATABASE_URL.'
  );
}

function runPsql(sql, database = 'postgres') {
  const psql = findPsql();
  execFileSync(psql, ['-U', 'postgres', '-h', '127.0.0.1', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    env: { ...process.env, PGPASSWORD: process.env.POSTGRES_PASSWORD || 'postgres' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function ensureDatabase(name) {
  try {
    runPsql(`CREATE DATABASE ${name}`);
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr) : String(error.message || error);
    if (!/already exists/i.test(stderr)) {
      console.error(stderr);
      throw error;
    }
  }
}

function resetDatabase(name) {
  runPsql(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${name}' AND pid <> pg_backend_pid();`
  );
  runPsql(`DROP DATABASE IF EXISTS ${name}`);
  runPsql(`CREATE DATABASE ${name}`);
}

function runPrisma(url, args) {
  const result = spawnSync('npx', ['prisma', ...args], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runSeed(url, { e2e, destructive }) {
  const result = spawnSync('npx', ['tsx', 'prisma/seed.ts'], {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: url,
      NODE_ENV: 'test',
      E2E_TEST_MODE: e2e ? 'true' : 'false',
      ...(destructive ? { ALLOW_DESTRUCTIVE_SEED: 'true' } : {}),
    },
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function prepareUnit() {
  const url = process.env.UNIT_TEST_DATABASE_URL || DEFAULT_UNIT;
  assertNotShared(url, 'UNIT_TEST_DATABASE_URL');
  ensureDatabase(databaseNameFromUrl(url));
  runPrisma(url, ['migrate', 'deploy']);
  runSeed(url, { e2e: false, destructive: false });
  return url;
}

function prepareE2e() {
  const url = process.env.E2E_DATABASE_URL || DEFAULT_E2E;
  assertNotShared(url, 'E2E_DATABASE_URL');
  resetDatabase(databaseNameFromUrl(url));
  runPrisma(url, ['migrate', 'deploy']);
  runSeed(url, { e2e: true, destructive: true });
  return url;
}

function dropE2eIfNeeded() {
  if (process.env.E2E_KEEP_DB === 'true') return;
  const url = process.env.E2E_DATABASE_URL || DEFAULT_E2E;
  try {
    runPsql(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseNameFromUrl(url)}' AND pid <> pg_backend_pid();`
    );
    runPsql(`DROP DATABASE IF EXISTS ${databaseNameFromUrl(url)}`);
  } catch (error) {
    console.warn('E2E database cleanup skipped:', error.message || error);
  }
}

function runChild(url, extraEnv, argv) {
  const command = argv[0];
  const args = argv.slice(1);
  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      ...extraEnv,
      DATABASE_URL: url,
    },
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const argv = process.argv.slice(2);
const dash = argv.indexOf('--');
const suite = argv[0];
const childArgs = dash >= 0 ? argv.slice(dash + 1) : [];

if (suite === 'unit') {
  const url = prepareUnit();
  if (childArgs.length > 0) {
    runChild(url, { NODE_ENV: 'test', UNIT_TEST_DATABASE_URL: url }, childArgs);
  }
} else if (suite === 'e2e') {
  const url = prepareE2e();
  try {
    if (childArgs.length > 0) {
      runChild(
        url,
        {
          E2E_DATABASE_URL: url,
          E2E_TEST_MODE: 'true',
          ALLOW_DEV_TENANT_FALLBACK: 'true',
          DEFAULT_TENANT_DOMAIN: 'carepulse',
        },
        childArgs
      );
    }
  } finally {
    dropE2eIfNeeded();
  }
} else if (suite === 'e2e-twice') {
  for (const run of [1, 2]) {
    console.log(`\n======== E2E isolated run ${run} / 2 ========\n`);
    const url = prepareE2e();
    const result = spawnSync('npx', ['playwright', 'test'], {
      cwd: root,
      env: {
        ...process.env,
        DATABASE_URL: url,
        E2E_DATABASE_URL: url,
        E2E_TEST_MODE: 'true',
        ALLOW_DEV_TENANT_FALLBACK: 'true',
        DEFAULT_TENANT_DOMAIN: 'carepulse',
      },
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      dropE2eIfNeeded();
      process.exit(result.status || 1);
    }
  }
  dropE2eIfNeeded();
} else {
  console.error('Usage: node scripts/isolated-db.mjs <unit|e2e|e2e-twice> [-- command]');
  process.exit(1);
}
