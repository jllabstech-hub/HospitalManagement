import { test, expect } from '@playwright/test';

test.describe('Complete System End-to-End MVP Lifecycles', () => {
  test('LIFECYCLE 1: Patient Registration -> Booking (BOOKED) -> Doctor Confirm (CONFIRMED) -> Doctor Complete (COMPLETED)', async ({ page }) => {
    const timestamp = Date.now();
    const patientEmail = `e2e.life1.${timestamp}@example.com`;

    // 1. Patient Registration
    await page.goto('/register');
    await page.fill('input[id="fullName"]', 'Lifecycle One Patient');
    await page.fill('input[id="email"]', patientEmail);
    await page.fill('input[id="password"]', 'test1234');
    await page.fill('input[id="confirmPassword"]', 'test1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // 2. Find Doctor & Book 12:00 PM Slot
    await page.goto('/patient/doctors');
    await page.fill('input[id="searchInput"]', 'Jane Smith');
    await page.click('a:has-text("Book Appointment")');
    await page.waitForSelector('button:has-text("12:00 PM")', { timeout: 10000 });
    await page.locator('button:has-text("12:00 PM")').first().click();
    await page.click('button:has-text("Proceed to Confirmation")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    // Logout Patient
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login');

    // 3. Doctor Login (Dr. Jane Smith: dr.smith@hospital.com)
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');

    // Doctor confirms appointment (BOOKED -> CONFIRMED)
    await page.goto('/doctor/appointments');
    await page.selectOption('select[id="docStatusFilter"]', 'BOOKED');
    await page.click('button[type="submit"]:has-text("Filter")');
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Confirm")').first().click();
    await page.waitForSelector('button:has-text("Confirm Appointment")', { timeout: 10000 });
    await page.click('button:has-text("Confirm Appointment")');

    // Doctor filters by CONFIRMED to view confirmed appointment
    await page.selectOption('select[id="docStatusFilter"]', 'CONFIRMED');
    await page.click('button[type="submit"]:has-text("Filter")');
    await page.waitForTimeout(1000);
    await expect(page.locator('span:has-text("CONFIRMED")').first()).toBeVisible();

    // Doctor completes appointment (CONFIRMED -> COMPLETED)
    await page.locator('button:has-text("Complete")').first().click();
    await page.waitForSelector('button:has-text("Mark Completed")', { timeout: 10000 });
    await page.click('button:has-text("Mark Completed")');

    // Doctor filters by COMPLETED to verify completed status
    await page.selectOption('select[id="docStatusFilter"]', 'COMPLETED');
    await page.click('button[type="submit"]:has-text("Filter")');
    await expect(page.locator('span:has-text("COMPLETED")').first()).toBeVisible();
  });

  test('LIFECYCLE 2: Patient A Books -> Patient A Cancels -> Patient B Re-books Same Slot (SUCCESS)', async ({ page, browser }) => {
    // 1. Patient A Books 02:00 PM Slot
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    await page.goto('/patient/doctors');
    await page.fill('input[id="searchInput"]', 'Robert Johnson');
    await page.click('a:has-text("Book Appointment")');
    await page.waitForSelector('button:has-text("02:00 PM")', { timeout: 10000 });
    await page.locator('button:has-text("02:00 PM")').first().click();
    await page.click('button:has-text("Proceed to Confirmation")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    // 2. Patient A Cancels Appointment
    await page.goto('/patient/appointments');
    await page.click('a:has-text("View Details")');
    await page.click('button:has-text("Cancel Appointment")');
    await page.click('button:has-text("Yes, Cancel Appointment")');
    await expect(page.locator('span:has-text("CANCELLED")').first()).toBeVisible();

    // 3. Patient B Logs in in an isolated browser context and books the released 02:00 PM slot
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/login');
    await pageB.click('button:has-text("Email & Password")');
    await pageB.fill('input[id="email"]', 'patient.bob@example.com');
    await pageB.fill('input[id="password"]', 'test123');
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL('**/patient/dashboard');

    await pageB.goto('/patient/doctors');
    await pageB.fill('input[id="searchInput"]', 'Robert Johnson');
    await pageB.click('a:has-text("Book Appointment")');
    await pageB.waitForSelector('button:has-text("02:00 PM")', { timeout: 10000 });
    await pageB.locator('button:has-text("02:00 PM")').first().click();
    await pageB.click('button:has-text("Proceed to Confirmation")');
    await pageB.click('button:has-text("Confirm Appointment")');

    // ASSERTION: Patient B successfully books the slot released by cancellation!
    await expect(pageB.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();
    await expect(pageB.getByText('Status: BOOKED')).toBeVisible();

    await contextB.close();
  });
});
