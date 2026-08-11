import { test, expect, devices } from '@playwright/test';
import { loginPatientA, loginDoctorA, loginAdmin } from '../fixtures/auth';

const VIEWPORTS = [
  { name: '320', width: 320, height: 568 },
  { name: '375', width: 375, height: 667 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

test.describe('Responsive smoke', () => {
  for (const vp of VIEWPORTS) {
    test(`Public home usable at ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      });
      expect(overflow, `horizontal overflow at ${vp.name}`).toBe(false);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('Patient dashboard at 375px', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport!);
    await loginPatientA(page);
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(overflow).toBe(false);
  });

  test('Doctor dashboard at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginDoctorA(page);
    await expect(page.getByRole('heading', { name: /Doctor Dashboard/i })).toBeVisible();
  });

  test('Admin dashboard at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAdmin(page);
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });
});
