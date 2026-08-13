import { test, expect } from '@playwright/test';

test.describe('Patient Doctor Discovery & Slot Selection E2E Suite', () => {
  test('TEST 1: Patient Login, Search Doctor, Select Date & Slot, View Confirmation Preview Modal', async ({ page }) => {
    // 1. Patient Login
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();

    // 2. Open Find a Doctor Page
    await page.click('a:has-text("Find a Doctor")');
    await page.waitForURL('**/patient/doctors');
    await expect(page.getByRole('heading', { name: 'Find a Doctor' })).toBeVisible();

    // 3. Search for Doctor "Smith"
    await page.fill('input[id="searchInput"]', 'Smith');
    await page.click('button[type="submit"]:has-text("Search")');
    await expect(page.getByText('Dr. Jane Smith')).toBeVisible();

    // 4. Open Doctor Profile
    await page.click('a:has-text("Book Appointment")');
    await page.waitForURL('**/patient/doctors/*');
    await expect(page.getByRole('heading', { name: 'Dr. Jane Smith' })).toBeVisible();
    await expect(page.getByText('Cardiology').first()).toBeVisible();

    // 5. Pick Date (Today's Date pre-populated)
    const slotDatePicker = page.locator('#slotDatePicker');
    await expect(slotDatePicker).toBeVisible();

    // Wait for slot grid to load
    await page.waitForSelector('button:has-text("09:00 AM"), button:has-text("10:00 AM")', { timeout: 10000 });

    // 6. Select a Slot (e.g. 09:00 AM)
    const slotBtn = page.locator('button:has-text("09:00 AM")').first();
    await slotBtn.click();

    // 7. Action Bar appears with Proceed button
    await expect(page.getByText('Selected Consultation Slot:')).toBeVisible();
    await page.click('button:has-text("Proceed to Confirmation")');

    // 8. Booking Confirmation Preview Modal
    await expect(page.getByRole('heading', { name: 'Confirm Appointment Selection' })).toBeVisible();
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
    await expect(page.getByText('Confirm Booking')).toBeVisible();

    // Verify Confirm Appointment button is visible
    const confirmBtn = page.locator('button:has-text("Confirm Appointment")');
    await expect(confirmBtn).toBeVisible();

    // Close Modal
    await page.click('button:has-text("Change Time")');
    await expect(page.getByRole('heading', { name: 'Confirm Appointment Selection' })).not.toBeVisible();
  });

  test('TEST 2: Patient Department Filter Flow', async ({ page }) => {
    // 1. Patient Login
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // 2. Open Find a Doctor Page
    await page.goto('/patient/doctors');

    // 3. Filter by Department
    await page.selectOption('select[id="deptFilter"]', { label: 'Cardiology' });
    await page.click('button[type="submit"]:has-text("Search")');

    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
    await expect(page.locator('main').getByText('Cardiology').first()).toBeVisible();
  });
});
