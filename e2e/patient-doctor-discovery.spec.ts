import { test, expect } from './fixtures/test';
import { firstAvailableSlot, searchAndOpenDoctor } from './fixtures/auth';

test.describe('Patient Doctor Discovery & Slot Selection E2E Suite', () => {
  test('TEST 1: Patient Login, Search Doctor, Select Date & Slot, View Confirmation Preview Modal', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');
    await expect(page.getByText('Patient Portal')).toBeVisible();

    await searchAndOpenDoctor(page, 'Jane Smith');
    await expect(page.getByRole('heading', { name: /Jane Smith/i })).toBeVisible();
    await expect(page.getByText('Cardiology').first()).toBeVisible();

    const slotDatePicker = page.locator('#slotDatePicker');
    await expect(slotDatePicker).toBeVisible();

    const slotBtn = await firstAvailableSlot(page);
    await slotBtn.click();

    await expect(page.getByText('Selected Consultation Slot:')).toBeVisible();
    await page.click('button:has-text("Proceed to Confirmation")');

    await expect(page.getByRole('heading', { name: 'Confirm Appointment Selection' })).toBeVisible();
    await expect(page.getByText('Dr. Jane Smith').first()).toBeVisible();
    await expect(page.getByText('Confirm Booking')).toBeVisible();

    const confirmBtn = page.locator('button:has-text("Confirm Appointment")');
    await expect(confirmBtn).toBeVisible();

    await page.click('button:has-text("Change Time")');
    await expect(page.getByRole('heading', { name: 'Confirm Appointment Selection' })).not.toBeVisible();
  });

  test('TEST 2: Patient Department Filter Flow', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    await page.goto('/patient/doctors');
    await page.selectOption('select[id="deptFilter"]', { label: 'Cardiology' });
    await page.waitForURL(/department=/i);

    const janeCard = page.locator('[data-testid="doctor-card"]').filter({ hasText: 'Jane Smith' }).first();
    await expect(janeCard).toBeVisible();
    await expect(janeCard.getByText('Cardiology')).toBeVisible();
  });
});
