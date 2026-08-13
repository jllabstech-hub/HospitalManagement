import { Page, expect } from '@playwright/test';

/** Seeded development fixtures used by Playwright (see prisma/seed.ts). */
export const SEED = {
  admin: { email: 'admin@hospital.com', password: 'test123' },
  doctorA: { email: 'dr.smith@hospital.com', password: 'test123', name: 'Dr. Jane Smith' },
  doctorB: { email: 'dr.johnson@hospital.com', password: 'test123', name: 'Dr. Robert Johnson' },
  patientA: { email: 'patient.alice@example.com', password: 'test123' },
  patientB: { email: 'patient.bob@example.com', password: 'test123' },
} as const;

export async function loginAs(
  page: Page,
  role: keyof typeof SEED
): Promise<void> {
  const creds = SEED[role];
  await page.goto('/login');
  const emailTab = page.locator('button:has-text("Email & Password")');
  if (await emailTab.isVisible()) {
    await emailTab.click();
  }
  await page.fill('input[id="email"]', creds.email);
  await page.fill('input[id="password"]', creds.password);
  await page.click('button[type="submit"]');
}

export async function loginPatientA(page: Page) {
  await loginAs(page, 'patientA');
  await page.waitForURL('**/patient/dashboard');
}

export async function loginPatientB(page: Page) {
  await loginAs(page, 'patientB');
  await page.waitForURL('**/patient/dashboard');
}

export async function loginDoctorA(page: Page) {
  await loginAs(page, 'doctorA');
  await page.waitForURL('**/doctor/dashboard');
}

export async function loginDoctorB(page: Page) {
  await loginAs(page, 'doctorB');
  await page.waitForURL('**/doctor/dashboard');
}

export async function loginAdmin(page: Page) {
  await loginAs(page, 'admin');
  await page.waitForURL('**/admin/dashboard');
}

export async function expectNoPasswordHashLeak(page: Page) {
  const html = await page.content();
  expect(html.toLowerCase()).not.toContain('passwordhash');
  expect(html).not.toMatch(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/);
}

export const PUBLIC_ROUTES = [
  '/',
  '/about/overview',
  '/about/leadership',
  '/about/facilities',
  '/departments',
  '/specialities',
  '/centres-of-excellence',
  '/doctors',
  '/services',
  '/health-packages',
  '/health-library',
  '/news',
  '/success-stories',
  '/patient-resources',
  '/patient-resources/faq',
  '/international-patients',
  '/insurance',
  '/contact',
  '/locations',
  '/search?q=cardio',
  '/book-appointment',
  '/privacy',
  '/terms',
] as const;
