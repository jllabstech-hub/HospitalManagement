import { test, expect } from '@playwright/test';

test.describe('Admin Appointments Overview & Filtering E2E Suite', () => {
  test('TEST 1: Admin Login, View Appointments Master List & Filter by Status', async ({ page }) => {
    // 1. Admin Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@hospital.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // 2. Open Admin Appointments Master Directory
    await page.goto('/admin/appointments');
    await expect(page.getByRole('heading', { name: 'Admin Appointments Master Directory' })).toBeVisible();

    // 3. Filter by Status
    await page.selectOption('select[id="adminStatusFilter"]', 'BOOKED');
    await page.click('button[type="submit"]:has-text("Filter")');

    // 4. View Detail
    const detailLink = page.locator('a:has-text("View Detail →")').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForURL('**/admin/appointments/*');
      await expect(page.getByRole('heading', { name: 'Appointment Specification' })).toBeVisible();
    }
  });
});
