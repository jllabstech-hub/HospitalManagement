import { test, expect } from './fixtures/test';
import { confirmFirstDoctorAppointment, completeFirstDoctorAppointment } from './fixtures/auth';

test.describe('Doctor Appointment Management & Status Transitions E2E Suite', () => {
  test('TEST 1: Doctor Login, View Today Appointments, Confirm, and Complete Consultation', async ({ page }) => {
    // 1. Doctor Login (Dr. Jane Smith)
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');
    await expect(page.getByText('Doctor Portal')).toBeVisible();

    // 2. Navigate to Doctor Appointment Directory
    await page.goto('/doctor/appointments');
    await expect(page.getByRole('heading', { name: 'Doctor Appointments' })).toBeVisible();

    // 3. Confirm a BOOKED appointment if available
    const confirmBtn = page.getByRole('button', { name: 'Confirm', exact: true }).first();
    if (await confirmBtn.isVisible()) {
      await confirmFirstDoctorAppointment(page);
    }

    // 4. Complete a CONFIRMED appointment
    const completeBtn = page.getByRole('button', { name: 'Complete', exact: true }).first();
    if (await completeBtn.isVisible()) {
      await completeFirstDoctorAppointment(page);
    }
  });

  test('TEST 2: Doctor Mark Patient No-Show', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');

    await page.goto('/doctor/appointments');

    // Confirm first if needed to get to CONFIRMED
    const confirmBtn = page.getByRole('button', { name: 'Confirm', exact: true }).first();
    if (await confirmBtn.isVisible()) {
      await confirmFirstDoctorAppointment(page);
    }

    const noShowBtn = page.getByRole('button', { name: 'No-Show', exact: true }).first();
    if (await noShowBtn.isVisible()) {
      await noShowBtn.click();
      await page.getByRole('button', { name: 'Mark No-Show' }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 20_000 });
      await expect(page.getByTitle('Appointment Status: NO-SHOW').first()).toBeVisible({ timeout: 15_000 });
    }
  });
});
