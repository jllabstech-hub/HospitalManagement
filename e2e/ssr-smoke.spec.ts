import { test, expect } from '@playwright/test';

/**
 * Verifies public routes return meaningful HTML from the server
 * (not an empty client-only shell).
 */
test.describe('SSR HTML smoke checks', () => {
  test('Homepage HTML includes hero, specialities, CTA, and JSON-LD', async ({ request }) => {
    const res = await request.get('/');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();

    expect(html).toContain('Exceptional Care');
    expect(html).toContain('Right When You Need It');
    expect(html).toContain('Book an Appointment');
    expect(html).toContain('Find a Doctor');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"Hospital"');
    expect(html).toContain('CarePulse');
    expect(html).not.toMatch(/<div id="__next"><\/div>/);
  });

  test('Login page HTML includes heading and form labels', async ({ request }) => {
    const res = await request.get('/login');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();

    expect(html).toContain('Welcome to CarePulse');
    expect(html).toContain('Patient Phone OTP');
    expect(html).toContain('Email &amp; Password');
  });

  test('Unauthenticated doctor directory redirects with login HTML (not empty shell)', async ({
    request,
  }) => {
    const res = await request.get('/patient/doctors', { maxRedirects: 0 });
    expect([302, 307, 308]).toContain(res.status());
    const location = res.headers()['location'] || '';
    expect(location).toContain('/login');
  });
});
