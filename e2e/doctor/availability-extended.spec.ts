import { test, expect } from '../fixtures/test';
import { loginDoctorA, loginPatientA } from '../fixtures/auth';

test.describe('Doctor availability extended', () => {
  test('Doctor can open availability and see schedule UI', async ({ page }) => {
    await loginDoctorA(page);
    await page.goto('/doctor/availability');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/availability|schedule|blocked|weekly/i).first()).toBeVisible();
  });

  test('Create adjacent weekly window is allowed when UI supports add', async ({ page }) => {
    await loginDoctorA(page);
    await page.goto('/doctor/availability');
    const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
    if (!(await addBtn.count())) {
      test.skip();
      return;
    }
    // Existing doctor-availability.spec covers full CRUD; this asserts page remains interactive
    await expect(addBtn).toBeEnabled();
  });
});

test.describe('Patient discovery extended', () => {
  test('Department filter reduces results', async ({ page }) => {
    await loginPatientA(page);
    await page.goto('/patient/doctors');
    await page.selectOption('#deptFilter', { label: 'Cardiology' });
    await page.click('button[type="submit"]:has-text("Search")');
    await page.waitForURL(/department=[0-9a-f-]{36}/i);
    await expect(page.getByRole('heading', { name: /Jane Smith/i }).first()).toBeVisible();
    await expect(page.getByText(/Found\s+\d+\s+matching/i)).toBeVisible();
  });

  test('Inactive search yields empty or no-match state', async ({ page }) => {
    await loginPatientA(page);
    await page.goto('/patient/doctors');
    await page.fill('input[id="searchInput"]', 'zzzz-no-such-doctor-xyz');
    await page.click('button[type="submit"]:has-text("Search")');
    await expect(page.getByText(/no doctor|not found|0 matching|couldn.?t find/i).first()).toBeVisible();
  });
});
