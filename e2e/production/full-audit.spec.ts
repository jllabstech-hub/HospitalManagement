import { test, expect } from '@playwright/test';
import {
  PUBLIC_ROUTES,
  loginAdmin,
  loginDoctorA,
  loginPatientA,
  expectNoPasswordHashLeak,
} from '../fixtures/auth';

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
] as const;

const DETAIL_ROUTES = [
  '/departments/cardiology',
  '/specialities/interventional-cardiology',
  '/centres-of-excellence/heart-vascular-centre',
  '/services/outpatient-consultations',
  '/health-packages/essential-heart-screening',
  '/health-library/understanding-heart-health-demo',
  '/news/new-cardiac-cath-lab-demo',
  '/success-stories/cardiac-recovery-success-demo',
  '/locations/carepulse-main-campus',
  '/about/leadership/dr-ananya-rao',
  '/doctors/dr-jane-smith',
] as const;

async function collectPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Auth.js logs CredentialsSignin to console on intentional bad login tests elsewhere;
      // ignore Next.js image optimizer noise only if non-app.
      if (text.includes('CredentialsSignin')) return;
      errors.push(`console.error: ${text}`);
    }
  });
  return errors;
}

test.describe('Production audit — public pages', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`Public ${route} renders without crash`, async ({ page }) => {
      const errors = await collectPageErrors(page);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.ok() || response?.status() === 304).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByRole('banner').or(page.locator('header')).first()).toBeVisible();
      await expect(page.getByRole('contentinfo').or(page.locator('footer')).first()).toBeVisible();
      await expectNoPasswordHashLeak(page);
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }

  for (const route of DETAIL_ROUTES) {
    test(`Detail ${route} SSR content + 200`, async ({ page }) => {
      const errors = await collectPageErrors(page);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      const html = await page.content();
      expect(html).toMatch(/<h1|<h2/i);
      expect(html.toLowerCase()).not.toContain('passwordhash');
      expect(errors, errors.join('\n')).toEqual([]);
    });
  }

  test('Invalid slug returns branded 404', async ({ page }) => {
    const response = await page.goto('/departments/this-slug-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /homepage/i })).toBeVisible();
  });

  test('/faqs redirects to patient-resources FAQ', async ({ page }) => {
    await page.goto('/faqs');
    await page.waitForURL(/patient-resources\/faq/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Privacy and Terms footer links work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/\/privacy/);
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL(/\/terms/);
  });

  test('SSR homepage HTML includes hero and JSON-LD', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('Exceptional Care');
    expect(html).toContain('application/ld+json');
    expect(html.toLowerCase()).not.toContain('passwordhash');
  });

  test('sitemap and robots are healthy', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const sm = await sitemap.text();
    expect(sm).toContain('/departments');
    expect(sm).toContain('/privacy');

    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const rb = await robots.text();
    expect(rb).toContain('Disallow: /patient/');
    expect(rb).toContain('Disallow: /admin/');
    expect(rb).toContain('Sitemap:');
  });
});

test.describe('Production audit — responsive overflow', () => {
  for (const vp of VIEWPORTS) {
    test(`Home no horizontal overflow at ${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto('/');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
      );
      expect(overflow).toBe(false);
    });
  }

  test('Patient doctors + booking UI at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginPatientA(page);
    await page.goto('/patient/doctors');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(overflow).toBe(false);
  });
});

test.describe('Production audit — portals', () => {
  test('Patient portal pages load', async ({ page }) => {
    const errors = await collectPageErrors(page);
    await loginPatientA(page);
    for (const path of ['/patient/dashboard', '/patient/doctors', '/patient/appointments']) {
      await page.goto(path);
      await expect(page.locator('main, body').first()).toBeVisible();
      await expectNoPasswordHashLeak(page);
    }
    expect(errors.filter((e) => !e.includes('upstream image'))).toEqual([]);
  });

  test('Doctor portal pages load', async ({ page }) => {
    await loginDoctorA(page);
    for (const path of [
      '/doctor/dashboard',
      '/doctor/availability',
      '/doctor/appointments',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoPasswordHashLeak(page);
    }
  });

  test('Admin portal + CMS hub FAQ link', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/content');
    await expect(page.getByRole('heading', { name: 'Content Management' })).toBeVisible();
    const faqCard = page.getByRole('link', { name: /FAQs/i });
    await expect(faqCard).toHaveAttribute('href', '/patient-resources/faq');
    await page.goto('/admin/content/hospital');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto('/admin/enquiries');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Production audit — a11y smoke', () => {
  test('Login keyboard focus and labels', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await page.getByLabel(/email/i).focus();
    await expect(page.getByLabel(/email/i)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/password/i)).toBeFocused();
  });

  test('Mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.getByRole('button', { name: /close menu/i }).click();
  });
});
