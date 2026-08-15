import { test, expect } from '../fixtures/test';
import { loginPatientA, loginDoctorA, firstAvailableSlot, searchAndOpenDoctor } from '../fixtures/auth';

test.describe('Accessibility smoke', () => {
  test('Login form has labels and focusable controls', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await expect(page.locator('label[for="email"], label:has-text("Email")').first()).toBeVisible();
    await expect(page.locator('label[for="password"], label:has-text("Password")').first()).toBeVisible();
    await page.locator('input[id="email"]').focus();
    await expect(page.locator('input[id="email"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('input[id="password"]')).toBeFocused();
  });

  test('Booking confirmation dialog has dialog semantics', async ({ page }) => {
    await loginPatientA(page);
    await searchAndOpenDoctor(page, 'Jane Smith');
    const slot = await firstAvailableSlot(page);
    await slot.click();
    await page.click('button:has-text("Proceed to Confirmation")');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await page.keyboard.press('Escape').catch(() => undefined);
  });

  test('Doctor availability page has accessible headings', async ({ page }) => {
    await loginDoctorA(page);
    await page.goto('/doctor/availability');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Public contact form fields are labelled', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: 'Send Us a Message' })).toBeVisible();
    const contactForm = page.locator('form').first();
    await expect(contactForm.getByLabel('Full name')).toBeVisible();
    await expect(contactForm.getByLabel('Email')).toBeVisible();
    await expect(contactForm.getByLabel('Message')).toBeVisible();
  });
});
