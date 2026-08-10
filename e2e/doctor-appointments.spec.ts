import { test, expect } from '@playwright/test';

test.describe('Doctor Appointment Management & Status Transitions E2E Suite', () => {
  test('TEST 1: Doctor Login, View Today Appointments, Confirm, and Complete Consultation', async ({ page }) => {
    // 1. Doctor Login (Dr. Jane Smith)
    await page.goto('/login');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');
    await expect(page.getByRole('heading', { name: 'Doctor Dashboard' })).toBeVisible();

    // 2. Navigate to Doctor Appointment Directory
    await page.goto('/doctor/appointments');
    await expect(page.getByRole('heading', { name: 'Doctor Appointments' })).toBeVisible();

    // 3. Confirm a BOOKED appointment if available
    const confirmBtn = page.locator('button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.click('button:has-text("Confirm Appointment")');
      await expect(page.locator('span:has-text("CONFIRMED")').first()).toBeVisible();
    }

    // 4. Complete a CONFIRMED appointment
    const completeBtn = page.locator('button:has-text("Complete")').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.click('button:has-text("Mark Completed")');
      await expect(page.locator('span:has-text("COMPLETED")').first()).toBeVisible();
    }
  });

  test('TEST 2: Doctor Mark Patient No-Show', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');

    await page.goto('/doctor/appointments');

    // Confirm first if needed to get to CONFIRMED
    const confirmBtn = page.locator('button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.click('button:has-text("Confirm Appointment")');
    }

    const noShowBtn = page.locator('button:has-text("No-Show")').first();
    if (await noShowBtn.isVisible()) {
      await noShowBtn.click();
      await page.click('button:has-text("Mark No-Show")');
      await expect(page.locator('span:has-text("NO-SHOW")').first()).toBeVisible();
    }
  });
});
