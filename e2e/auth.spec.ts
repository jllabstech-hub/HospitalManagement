import { test, expect } from './fixtures/test';

test.describe('Authentication & Role-Based Authorization E2E Suite', () => {
    const timestamp = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const testPatientEmail = `e2e.patient.${timestamp}@example.com`;

  test('TEST 1 & 2: Patient Registration and Login Flow', async ({ page }) => {
    // 1. Visit Registration Page
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Patient Registration' })).toBeVisible();

    // 2. Fill Registration Form
    await page.fill('input[id="fullName"]', 'E2E Test Patient');
    await page.fill('input[id="email"]', testPatientEmail);
    await page.fill('input[id="password"]', 'test1234');
    await page.fill('input[id="confirmPassword"]', 'test1234');

    // 3. Submit Form
    await page.click('button[type="submit"]');

    // 4. Assert Redirection to Patient Dashboard
    await page.waitForURL('**/patient/dashboard');
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();
    await expect(page.getByText(testPatientEmail).first()).toBeVisible();
    await expect(page.getByText('PATIENT').first()).toBeVisible();
  });

  test('TEST 3: Doctor Login with Seeded Account', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/doctor/dashboard');
    await expect(page.getByRole('heading', { name: 'Doctor Dashboard' })).toBeVisible();
    await expect(page.getByText('dr.smith@hospital.com').first()).toBeVisible();
    await expect(page.getByText('Role: DOCTOR').first()).toBeVisible();
  });

  test('TEST 4: Admin Login with Seeded Account', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'admin@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByText('admin@hospital.com')).toBeVisible();
    await expect(page.getByText('Role: ADMIN')).toBeVisible();
  });

  test('TEST 5: Unauthenticated User Redirected from Protected Route', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForURL('**/login?callbackUrl=%2Fpatient%2Fdashboard');
    await expect(page.getByRole('heading', { name: 'Welcome to CarePulse' })).toBeVisible();
  });

  test('TEST 6: Patient Denied Access to Admin Area', async ({ page }) => {
    // Log in as patient
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'patient.alice@example.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/patient/dashboard');

    // Attempt direct URL access to Admin Dashboard
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/patient/dashboard');
    await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible();
  });

  test('TEST 7: Doctor Denied Access to Admin Area', async ({ page }) => {
    // Log in as doctor
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'dr.smith@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/doctor/dashboard');

    // Attempt direct URL access to Admin Dashboard
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/doctor/dashboard');
    await expect(page.getByRole('heading', { name: 'Doctor Dashboard' })).toBeVisible();
  });

  test('TEST 8: Logout Invalidates Session', async ({ page }) => {
    // Log in as admin
    await page.goto('/login');
    await page.click('button:has-text("Email & Password")');
    await page.fill('input[id="email"]', 'admin@hospital.com');
    await page.fill('input[id="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');

    // Click Sign Out
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login');

    // Attempt to navigate back to protected page
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/login?callbackUrl=%2Fadmin%2Fdashboard');
  });
});
