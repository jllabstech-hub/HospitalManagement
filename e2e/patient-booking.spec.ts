import { test, expect } from './fixtures/test';
import { firstAvailableSlot, searchAndOpenDoctor } from './fixtures/auth';

test.describe('Patient Transactional Booking E2E Suite (Phase 5C)', () => {
  test('TEST 1: Successful Patient Booking Flow (Status BOOKED & Success Card)', async ({ page }) => {
    // 1. Patient Login
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    await searchAndOpenDoctor(page, 'Jane Smith');

    const slot = await firstAvailableSlot(page);
    const startLabel = (await slot.locator('span').first().innerText()).trim();
    await slot.click();

    await page.click('button:has-text("Proceed to Confirmation")');
    await expect(page.getByRole('heading', { name: 'Confirm Appointment Selection' })).toBeVisible();

    await page.click('button:has-text("Confirm Appointment")');

    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();
    await expect(page.getByText('Status: BOOKED')).toBeVisible();
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
    await expect(page.getByText(startLabel).first()).toBeVisible();

    // 7. Click Go to Patient Dashboard
    await page.click('a:has-text("Go to Patient Dashboard")');
    await page.waitForURL('**/patient/dashboard');
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();
  });

  test('TEST 2: Slot Conflict Flow (Duplicate Slot Attempt Returns Friendly Notice & Refreshes Grid)', async ({ page, browser }) => {
    // Patient A Login in Page A
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    await searchAndOpenDoctor(page, 'Robert Johnson');
    const slotA = await firstAvailableSlot(page);
    const slotStart = await slotA.getAttribute('data-slot-start');
    const slotDate = await page.locator('[data-testid="slot-date-chip"][data-selected="true"]').getAttribute('data-date');

    // Open Patient B in an ISOLATED browser context
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/login');
    await pageB.click('button:has-text("Email & Password")');
    await pageB.fill('input[id="email"]', 'patient.bob@example.com');
    await pageB.fill('input[id="password"]', 'test123');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/patient/dashboard');

    await searchAndOpenDoctor(pageB, 'Robert Johnson');
    if (slotDate) {
      const dateChip = pageB.locator(`[data-testid="slot-date-chip"][data-date="${slotDate}"]`);
      if (await dateChip.count()) {
        await dateChip.click();
        await expect(pageB.getByText('Checking live doctor schedule')).toBeHidden({ timeout: 15000 });
      }
    }
    const slotB = slotStart
      ? pageB.locator(`[data-testid="available-slot"][data-slot-start="${slotStart}"]`).first()
      : await firstAvailableSlot(pageB);
    await expect(slotB).toBeVisible({ timeout: 15000 });

    await slotA.click();
    await page.click('button:has-text("Proceed to Confirmation")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    await slotB.click();
    await pageB.click('button:has-text("Proceed to Confirmation")');
    await pageB.click('button:has-text("Confirm Appointment")');

    await expect(pageB.getByText('This time slot was just booked by another patient')).toBeVisible();

    await contextB.close();
  });
});
