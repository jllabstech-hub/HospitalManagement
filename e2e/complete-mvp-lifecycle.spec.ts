import { test, expect } from './fixtures/test';
import {
  completeFirstDoctorAppointment,
  confirmFirstDoctorAppointment,
  firstAvailableSlot,
  searchAndOpenDoctor,
} from './fixtures/auth';

test.describe('Complete System End-to-End MVP Lifecycles', () => {
  test.setTimeout(180_000);
  test('LIFECYCLE 1: Patient Registration -> Booking (BOOKED) -> Doctor Confirm (CONFIRMED) -> Doctor Complete (COMPLETED)', async ({ page }) => {
    const timestamp = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const patientEmail = `e2e.life1.${timestamp}@example.com`;

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Patient Registration' })).toBeVisible();
    await page.fill('input[id="fullName"]', 'Lifecycle One Patient');
    await page.fill('input[id="email"]', patientEmail);
    await page.fill('input[id="password"]', 'test1234');
    await page.fill('input[id="confirmPassword"]', 'test1234');
    await page.click('button[type="submit"]');
    try {
      await page.waitForURL(/\/(patient\/dashboard|login)/, { timeout: 25_000, waitUntil: 'domcontentloaded' });
    } catch {
      // Registration may have created the account without completing client navigation.
    }
    if (!page.url().includes('/patient/dashboard')) {
      await page.goto('/login');
      await page.click('button:has-text("Email & Password")');
      await page.fill('input[id="email"]', patientEmail);
      await page.fill('input[id="password"]', 'test1234');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/patient/dashboard', { waitUntil: 'domcontentloaded' });
    }

    await searchAndOpenDoctor(page, 'Jane Smith');
    const slot = await firstAvailableSlot(page);
    const bookedDate = await page.locator('[data-testid="slot-date-chip"][data-selected="true"]').getAttribute('data-date');
    await slot.click();
    await page.click('button:has-text("Proceed to Confirmation")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login');

    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');

    const dateQuery = bookedDate ? `?date=${bookedDate}` : '';
    await page.goto(`/doctor/appointments${dateQuery}`);
    await confirmFirstDoctorAppointment(page);
    await completeFirstDoctorAppointment(page);
    await expect(page.getByTitle('Appointment Status: COMPLETED').first()).toBeVisible();
  });

  test('LIFECYCLE 2: Patient A Books -> Patient A Cancels -> Patient B Re-books Same Slot (SUCCESS)', async ({ page, browser }) => {
    // 1. Patient A Books a dynamic slot
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
    await slotA.click();
    await page.click('button:has-text("Proceed to Confirmation")');
    await page.click('button:has-text("Confirm Appointment")');
    await expect(page.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();

    // 2. Patient A Cancels Appointment
    await page.goto('/patient/appointments');
    await page.click('a:has-text("View Details")');
    await page.click('button:has-text("Cancel Appointment")');
    await page.click('button:has-text("Yes, Cancel Appointment")');
    await expect(page.locator('span:has-text("CANCELLED")').first()).toBeVisible();

    // 3. Patient B Logs in in an isolated browser context and books the released slot
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
      }
    }
    const released = slotStart
      ? pageB.locator(`[data-testid="available-slot"][data-slot-start="${slotStart}"]`).first()
      : await firstAvailableSlot(pageB);
    await expect(released).toBeVisible({ timeout: 15000 });
    await released.click();
    await pageB.click('button:has-text("Proceed to Confirmation")');
    await pageB.click('button:has-text("Confirm Appointment")');

    // ASSERTION: Patient B successfully books the slot released by cancellation!
    await expect(pageB.getByRole('heading', { name: 'Appointment Booked!' })).toBeVisible();
    await expect(pageB.getByText('Status: BOOKED')).toBeVisible();

    await contextB.close();
  });
});
