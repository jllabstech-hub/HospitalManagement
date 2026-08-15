import { test, expect } from './fixtures/test';
import { loginAdmin } from './fixtures/auth';

test.describe('Admin content import', () => {
  test('admin can open the content import screen', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/content-import');
    await expect(page.getByRole('heading', { level: 1, name: 'Populate Hospital Content' })).toBeVisible();
    await expect(page.getByText('Doctors (not available)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crawl Website' })).toBeVisible();
  });
});
