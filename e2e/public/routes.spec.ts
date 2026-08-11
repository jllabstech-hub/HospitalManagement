import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES, expectNoPasswordHashLeak } from '../fixtures/auth';

test.describe('Public website — route smoke & SSR', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route} returns 200 with meaningful HTML`, async ({ request, page }) => {
      const res = await request.get(route);
      expect(res.status(), route).toBe(200);
      const html = await res.text();
      expect(html.length, route).toBeGreaterThan(400);
      expect(html).toMatch(/<title|<h1|CarePulse/i);

      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await expectNoPasswordHashLeak(page);
      expect(errors, `pageerror on ${route}: ${errors.join('; ')}`).toEqual([]);
    });
  }

  test('Invalid public slugs return 404', async ({ page }) => {
    for (const path of [
      '/departments/this-slug-does-not-exist-xyz',
      '/specialities/this-slug-does-not-exist-xyz',
      '/services/this-slug-does-not-exist-xyz',
      '/news/this-slug-does-not-exist-xyz',
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
  });

  test('Header and footer present on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: /Primary|Mobile/i }).first()).toBeVisible();
    await expect(page.locator('footer').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Book Appointment/i }).first()).toBeVisible();
  });

  test('Global search returns grouped results for known term', async ({ page }) => {
    await page.goto('/search?q=Cardiology');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const body = await page.getByRole('main').innerText();
    expect(body.toLowerCase()).toContain('cardio');
  });

  test('Book appointment entry page renders discovery CTAs', async ({ page }) => {
    await page.goto('/book-appointment');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /doctor|department|login|book/i }).first()).toBeVisible();
  });

  test('Department detail links to doctors / book', async ({ page }) => {
    await page.goto('/departments/cardiology');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const html = await page.content();
    expect(html).toMatch(/Cardiology|doctor|Book/i);
  });

  test('Public doctor directory lists seeded doctors', async ({ page }) => {
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Jane Smith|Robert Johnson/i).first()).toBeVisible();
  });
});
