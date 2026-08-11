import { test, expect } from '@playwright/test';

test.describe('Patient Appointment Management E2E Suite', () => {
  test('TEST 1: View Patient Appointments, Detail Page, and Cancel Upcoming Appointment', async ({ page }) => {
    // 1. Patient Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // 2. Book an upcoming appointment
    await page.goto('/patient/doctors');
    await page.fill('input[id="searchInput"]', 'Jane Smith');
    await page.click('button[type="submit"]:has-text("Search")');
    await page.click('a:has-text("View Profile & Book")');
    await page.waitForSelector('button:has-text("11:30 AM")', { timeout: 10000 });
    await page.locator('button:has-text("11:30 AM")').first().click();
    await page.click('button[type="submit"]:has-text("Proceed to Confirmation â†’"), button:has-text("Proceed to Confirmation â†’")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    // 3. Open My Appointments Overview
    await page.goto('/patient/appointments');
    await expect(page.getByRole('heading', { name: 'My Appointments' })).toBeVisible();
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();

    // 4. Open Appointment Detail Page
    await page.click('a:has-text("View Details â†’")');
    await page.waitForURL('**/patient/appointments/*');
    await expect(page.getByRole('heading', { name: 'Consultation Details' })).toBeVisible();

    // 5. Cancel Appointment with Dialog
    await page.click('button:has-text("Cancel Appointment")');
    await expect(page.getByRole('heading', { name: 'Cancel Appointment' })).toBeVisible();
    await page.fill('input[id="cancelReasonInput"]', 'Testing cancellation E2E');
    await page.click('button:has-text("Yes, Cancel Appointment")');

    // 6. Assert Status updated to CANCELLED
    await expect(page.getByText('CANCELLED', { exact: true }).first()).toBeVisible();

    // 7. Verify moved to Cancelled tab in My Appointments
    await page.goto('/patient/appointments?tab=cancelled');
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
  });
});
