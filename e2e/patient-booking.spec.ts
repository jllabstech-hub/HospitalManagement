import { test, expect } from '@playwright/test';

test.describe('Patient Transactional Booking E2E Suite (Phase 5C)', () => {
  test('TEST 1: Successful Patient Booking Flow (Status BOOKED & Success Card)', async ({ page }) => {
    // 1. Patient Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // 2. Navigate to Doctor Directory
    await page.click('a:has-text("Find a Doctor")');
    await page.waitForURL('**/patient/doctors');

    // 3. Search and View Doctor Profile
    await page.fill('input[id="searchInput"]', 'Jane Smith');
    await page.click('button[type="submit"]:has-text("Search")');
    await page.click('a:has-text("View Profile & Book")');
    await page.waitForURL('**/patient/doctors/*');

    // 4. Select Slot
    await page.waitForSelector('button:has-text("10:00 AM")', { timeout: 10000 });
    await page.locator('button:has-text("10:00 AM")').first().click();

    // 5. Open Modal & Confirm Booking
    await page.click('button:has-text("Proceed to Confirmation →")');
    await expect(page.getByRole('heading', { name: 'Confirm Appointment Selection' })).toBeVisible();

    await page.click('button:has-text("Confirm Appointment")');

    // 6. Assert Success Screen with status BOOKED
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();
    await expect(page.getByText('Status: BOOKED')).toBeVisible();
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
    await expect(page.getByText('10:00 AM').first()).toBeVisible();

    // 7. Click Go to Patient Dashboard
    await page.click('a:has-text("Go to Patient Dashboard")');
    await page.waitForURL('**/patient/dashboard');
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();
  });

  test('TEST 2: Slot Conflict Flow (Duplicate Slot Attempt Returns Friendly Notice & Refreshes Grid)', async ({ page, browser }) => {
    // Patient A Login in Page A
    await page.goto('/login');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // Open Doctor Profile in Page A
    await page.goto('/patient/doctors');
    await page.fill('input[id="searchInput"]', 'Robert Johnson');
    await page.click('button[type="submit"]:has-text("Search")');
    await page.click('a:has-text("View Profile & Book")');
    await page.waitForSelector('button:has-text("11:00 AM")', { timeout: 10000 });

    // Open Patient B in an ISOLATED browser context
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/login');
    await pageB.fill('input[id="email"]', 'patient.bob@example.com');
    await pageB.fill('input[id="password"]', 'Password123!');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/patient/dashboard');

    await pageB.goto('/patient/doctors');
    await pageB.fill('input[id="searchInput"]', 'Robert Johnson');
    await pageB.click('button[type="submit"]:has-text("Search")');
    await pageB.click('a:has-text("View Profile & Book")');
    await pageB.waitForSelector('button:has-text("11:00 AM")', { timeout: 10000 });

    // Patient A selects 11:00 AM and confirms booking
    await page.locator('button:has-text("11:00 AM")').first().click();
    await page.click('button:has-text("Proceed to Confirmation →")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    // Patient B attempts to select 11:00 AM and confirms booking
    await pageB.locator('button:has-text("11:00 AM")').first().click();
    await pageB.click('button:has-text("Proceed to Confirmation →")');
    await pageB.click('button:has-text("Confirm Appointment")');

    // Patient B receives Conflict Notice
    await expect(pageB.getByText('This time slot was just booked by another patient')).toBeVisible();

    await contextB.close();
  });
});
