import { test, expect } from '@playwright/test';
import {
  loginAdmin,
  loginDoctorA,
  loginPatientA,
  SEED,
  expectNoPasswordHashLeak,
} from '../fixtures/auth';

test.describe('Security & RBAC matrix', () => {
  test('Unauthenticated cannot access patient/doctor/admin portals', async ({ page }) => {
    for (const path of ['/patient/dashboard', '/doctor/dashboard', '/admin/dashboard']) {
      await page.goto(path);
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('callbackUrl');
    }
  });

  test('Patient denied doctor and admin areas', async ({ page }) => {
    await loginPatientA(page);
    await page.goto('/admin/doctors');
    await page.waitForURL('**/patient/dashboard');
    await page.goto('/doctor/availability');
    await page.waitForURL('**/patient/dashboard');
    await expectNoPasswordHashLeak(page);
  });

  test('Doctor denied admin and patient portals', async ({ page }) => {
    await loginDoctorA(page);
    await page.goto('/admin/doctors');
    await page.waitForURL('**/doctor/dashboard');
    await page.goto('/patient/doctors');
    await page.waitForURL('**/doctor/dashboard');
  });

  test('Admin denied patient and doctor portals', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/patient/dashboard');
    await page.waitForURL('**/admin/dashboard');
    await page.goto('/doctor/dashboard');
    await page.waitForURL('**/admin/dashboard');
  });

  test('Patient IDOR: forged appointment id does not expose other patient data', async ({
    page,
  }) => {
    await loginPatientA(page);
    const response = await page.goto(
      '/patient/appointments/00000000-0000-4000-8000-000000000099'
    );
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Consultation Details' })).toHaveCount(0);
    await expectNoPasswordHashLeak(page);
  });

  test('Invalid login credentials show friendly error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', SEED.patientA.email);
    await page.fill('input[id="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('alert').or(page.getByText(/invalid|incorrect/i))).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Registration rejects weak password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[id="fullName"]', 'Weak Pass User');
    await page.fill('input[id="email"]', `weak.${Date.now()}@example.com`);
    await page.fill('input[id="password"]', '123');
    await page.fill('input[id="confirmPassword"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/password|characters|minimum|invalid/i').first()).toBeVisible();
  });

  test('Login page never exposes passwordHash', async ({ page }) => {
    await page.goto('/login');
    await expectNoPasswordHashLeak(page);
  });
});
