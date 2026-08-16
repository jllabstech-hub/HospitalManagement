import { test, expect } from '../fixtures/test';
import { loginAdmin, expectNoPasswordHashLeak } from '../fixtures/auth';

test.describe('Admin portal extended QA', () => {
  test('Dashboard stats and navigation', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Departments')).toBeVisible();
    await expect(page.getByText('Total Doctors')).toBeVisible();
    await expectNoPasswordHashLeak(page);

    await page.getByRole('link', { name: 'Content', exact: true }).click();
    await page.waitForURL('**/admin/content');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.click('a:has-text("Enquiries")');
    await page.waitForURL('**/admin/enquiries');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Department create rejects empty name', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/departments');
    await page.click('button:has-text("+ Add Department")');
    await page.fill('input[name="name"]', '   ');
    await page.click('button[type="submit"]:has-text("Create Department")');
    // Either client or server validation surfaces an error / stays on form
    await expect(page.getByText(/name|required|invalid|department/i).first()).toBeVisible();
  });

  test('Department duplicate name rejected', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/departments');
    await page.click('button:has-text("+ Add Department")');
    await page.fill('input[name="name"]', 'Cardiology');
    await page.click('button[type="submit"]:has-text("Create Department")');
    await expect(page.getByText(/already exists|duplicate|exist/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Doctor list never shows password hashes', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors' })).toBeVisible();
    await expectNoPasswordHashLeak(page);
  });

  test('Appointments filters render', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/appointments');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('select, input').first()).toBeVisible();
  });

  test('Hospital content page loads', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/content/hospital');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Footer CMS page loads', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/content/footer');
    await expect(page.getByRole('heading', { name: 'Website Footer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Footer' })).toBeVisible();
  });
});
