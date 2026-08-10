import { test, expect } from '@playwright/test';

test.describe('Public hospital website journeys', () => {
  test('Journey 2: Homepage → Specialities → Find Doctors', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/specialities');
    await expect(page.getByRole('heading', { name: /Specialit/i })).toBeVisible();

    const firstLink = page.locator('a[href^="/specialities/"]').first();
    if (await firstLink.count()) {
      await firstLink.click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const doctorsCta = page.getByRole('link', { name: /Find Doctor|View Doctor|Doctors/i }).first();
      if (await doctorsCta.count()) {
        await doctorsCta.click();
      }
    }

    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: /Find|Doctor/i })).toBeVisible();
  });

  test('Journey 5: Homepage → Contact → Submit Contact Form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.fill('input[name="name"]', 'E2E Visitor');
    await page.fill('input[name="email"]', `visitor.${Date.now()}@example.com`);
    await page.fill('input[name="subject"]', 'General enquiry');
    await page.fill('textarea[name="message"]', 'This is a demo contact message from Playwright.');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/thank|received|sent|success/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('Journey 6: International Patients enquiry', async ({ page }) => {
    await page.goto('/international-patients');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.fill('input[name="name"]', 'Intl Patient');
    await page.fill('input[name="email"]', `intl.${Date.now()}@example.com`);
    await page.fill('input[name="country"]', 'United Arab Emirates');
    const message = page.locator('textarea[name="message"]');
    if (await message.count()) {
      await message.fill('Requesting a consultation overview (demo).');
    }
    await page.click('button[type="submit"]');
    await expect(page.getByText(/thank|received|sent|success/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('Public SSR pages return meaningful HTML', async ({ request }) => {
    for (const path of ['/', '/doctors', '/specialities', '/contact', '/about/overview']) {
      const res = await request.get(path);
      expect(res.ok(), path).toBeTruthy();
      const html = await res.text();
      expect(html.length, path).toBeGreaterThan(500);
      expect(html).toMatch(/CarePulse|<h1|<title/i);
    }
  });
});
