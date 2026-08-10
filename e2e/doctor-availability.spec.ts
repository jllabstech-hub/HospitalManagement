import { test, expect } from '@playwright/test';

test.describe('Doctor Schedule Manager E2E Suite', () => {
  test('TEST 1: Doctor Login, Weekly Availability & Blocked Date CRUD', async ({ page }) => {
    // 1. Doctor Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');

    // 2. Open Schedule Manager
    await page.click('a:has-text("Schedule Manager")');
    await page.waitForURL('**/doctor/availability');
    await expect(page.getByRole('heading', { name: 'Doctor Schedule Manager' })).toBeVisible();

    // 3. Add Working Window for Saturday (dayOfWeek: 6)
    const saturdayCard = page.getByTestId('day-card-6');
    await saturdayCard.getByRole('button', { name: '+ Add Working Window' }).click();
    await page.waitForSelector('#availStartTime', { state: 'visible' });
    await page.fill('#availStartTime', '09:00');
    await page.fill('#availEndTime', '13:00');
    await page.click('button[type="submit"]:has-text("Add Window")');
    await expect(page.getByText('Availability window added successfully!')).toBeVisible();

    // 4. Edit Working Window
    await saturdayCard.getByRole('button', { name: 'Edit' }).click();
    await page.waitForSelector('#editAvailStartTime', { state: 'visible' });
    await page.fill('#editAvailStartTime', '10:00');
    await page.click('button[type="submit"]:has-text("Save Changes")');
    await expect(page.getByText('Availability window updated successfully!')).toBeVisible();

    // 5. Delete Working Window
    await saturdayCard.getByRole('button', { name: 'Delete' }).click();
    await page.click('button:has-text("Delete Window")');
    await expect(page.getByText('Availability window deleted.')).toBeVisible();

    // 6. Add Blocked Date (Full Day)
    await page.click('button:has-text("+ Block Date / Range")');
    await page.waitForSelector('#blockStartDate', { state: 'visible' });

    // Read the pre-populated default date from the date input
    const targetDate = await page.inputValue('#blockStartDate');
    await page.fill('#blockReason', 'Christmas Leave');
    await page.click('button[type="submit"]:has-text("Add Blocked Date")');
    await expect(page.getByText('Blocked date created successfully!')).toBeVisible();
    await expect(page.getByText(targetDate)).toBeVisible();

    // 7. Delete Blocked Date
    await page.click(`tr:has-text("${targetDate}") button:has-text("Delete")`);
    await page.click('button:has-text("Remove Block")');
    await expect(page.getByText('Blocked date entry removed.')).toBeVisible();
  });

  test('TEST 2A: Patient Role Denied Access to Doctor Availability', async ({ page }) => {
    // 1. Patient Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // 2. Direct access attempt
    await page.goto('/doctor/availability');
    await page.waitForURL('**/patient/dashboard'); // Denied & redirected back to patient dashboard
  });

  test('TEST 2B: Admin Role Denied Access to Doctor Availability', async ({ page }) => {
    // 1. Admin Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@hospital.com');
    await page.fill('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // 2. Direct access attempt
    await page.goto('/doctor/availability');
    await page.waitForURL('**/admin/dashboard'); // Denied & redirected back to admin dashboard
  });
});
