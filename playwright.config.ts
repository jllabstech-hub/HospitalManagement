import { defineConfig, devices } from '@playwright/test';

const e2eDbUrl = process.env.E2E_DATABASE_URL;
if (!e2eDbUrl) {
  throw new Error(
    'E2E_DATABASE_URL is required. Run `npm run test:e2e` so Playwright uses an isolated PostgreSQL database.'
  );
}
if (/\.neon\.tech|neon\.build/i.test(e2eDbUrl)) {
  throw new Error('E2E_DATABASE_URL must not point at the shared Neon database.');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'docs/e2e-junit-results.xml' }],
  ],
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next dev -p 5001',
    url: 'http://localhost:5001',
    reuseExistingServer: false,
    timeout: 180 * 1000,
    env: {
      ...process.env,
      DATABASE_URL: e2eDbUrl,
      E2E_TEST_MODE: 'true',
      SINGLE_TENANT: 'true',
      ALLOW_DEV_TENANT_FALLBACK: 'true',
      DEFAULT_TENANT_DOMAIN: 'carepulse',
      AUTH_URL: 'http://localhost:5001',
      NEXTAUTH_URL: 'http://localhost:5001',
      NEXT_PUBLIC_APP_URL: 'http://localhost:5001',
      AUTH_SECRET: 'e2e-auth-secret-key-min-32-chars-xxxx',
      NEXTAUTH_SECRET: 'e2e-auth-secret-key-min-32-chars-xxxx',
    },
  },
});
