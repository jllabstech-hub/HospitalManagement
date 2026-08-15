import { test, expect } from './fixtures/test';
import { firstAvailableSlot, searchAndOpenDoctor } from './fixtures/auth';

test.describe('Patient Appointment Management E2E Suite', () => {
  test('TEST 1: View Patient Appointments, Detail Page, and Cancel Upcoming Appointment', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    await searchAndOpenDoctor(page, 'Jane Smith');
    const slot = await firstAvailableSlot(page);
    await slot.click();
    await page.click('button:has-text("Proceed to Confirmation")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    await page.goto('/patient/appointments');
    await expect(page.getByRole('heading', { name: 'My Appointments' })).toBeVisible();
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();

    await page.click('a:has-text("View Details")');
    await page.waitForURL('**/patient/appointments/*');
    await expect(page.getByRole('heading', { name: 'Consultation Details' })).toBeVisible();

    await page.click('button:has-text("Cancel Appointment")');
    await expect(page.getByRole('heading', { name: 'Cancel Appointment' })).toBeVisible();
    await page.fill('input[id="cancelReasonInput"]', 'Testing cancellation E2E');
    await page.click('button:has-text("Yes, Cancel Appointment")');

    await expect(page.getByText('CANCELLED', { exact: true }).first()).toBeVisible();

    await page.goto('/patient/appointments?tab=cancelled');
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
  });
});
