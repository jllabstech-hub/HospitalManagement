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

export async function expectPatientPortal(page: Page) {
  await expect(page.getByText('Patient Portal')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Your care, all in one place/i })).toBeVisible();
}

export async function expectDoctorPortal(page: Page) {
  await expect(page.getByText('Doctor Portal')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Your clinical day, in focus/i })).toBeVisible();
}

export async function expectNoPasswordHashLeak(page: Page) {
  const html = await page.content();
  expect(html.toLowerCase()).not.toContain('passwordhash');
  expect(html).not.toMatch(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/);
}

export async function searchAndOpenDoctor(page: Page, doctorName: string) {
  await page.goto('/patient/doctors');
  await page.fill('input[id="searchInput"]', doctorName);
  await page.click('button[type="submit"]:has-text("Search")');
  await page.waitForURL(/search=/i, { timeout: 15000 });
  const card = page.locator('[data-testid="doctor-card"]').filter({ hasText: doctorName }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.getByRole('link', { name: /Book Appointment/i }).click();
  await page.waitForURL(/\/patient\/doctors\/[^/?]+/);
}

export async function firstAvailableSlot(page: Page) {
  const chips = page.locator('[data-testid="slot-date-chip"]');
  await expect(chips.first()).toBeVisible({ timeout: 15000 });
  const chipCount = await chips.count();
  for (let i = 0; i < Math.max(chipCount, 1); i += 1) {
    await chips.nth(i).click();
    await expect(page.getByText('Checking live doctor schedule')).toBeHidden({ timeout: 15000 });
    const slot = page.locator('[data-testid="available-slot"]').first();
    const empty = page.getByText('No Appointments Available');
    await Promise.race([
      slot.waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined),
      empty.waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined),
    ]);
    if (await slot.isVisible().catch(() => false)) {
      return slot;
    }
  }
  const slot = page.locator('[data-testid="available-slot"]').first();
  await expect(slot).toBeVisible({ timeout: 15000 });
  return slot;
}

/** Wait for the doctor confirm/complete dialog to finish its server action. */
async function waitForDoctorStatus(page: Page, status: 'CONFIRMED' | 'COMPLETED' | 'NO-SHOW') {
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByTitle(`Appointment Status: ${status}`).first()).toBeVisible({ timeout: 15_000 });
}

export async function confirmFirstDoctorAppointment(page: Page) {
  await page.getByRole('button', { name: 'Confirm', exact: true }).first().click();
  await page.getByRole('button', { name: 'Confirm Appointment' }).click();
  await waitForDoctorStatus(page, 'CONFIRMED');
}

export async function completeFirstDoctorAppointment(page: Page) {
  await page.getByRole('button', { name: 'Complete', exact: true }).first().click();
  await page.getByRole('button', { name: 'Mark Completed' }).click();
  await waitForDoctorStatus(page, 'COMPLETED');
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
