import { test, expect } from './fixtures/test';
import { loginAdmin } from './fixtures/auth';

test.describe('CMS image generation', () => {
  test('admin can generate, preview, attach, and see a speciality image on the public page', async ({ page }) => {
    await loginAdmin(page);

    await page.goto('/admin/specialities');
    await expect(page.getByRole('heading', { name: 'Medical Specialities' })).toBeVisible();

    const name = `E2E Cardiology Image ${Date.now()}`;
    await page.locator('form input').first().fill(name);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });

    const card = page.locator('.p-4.border.rounded.bg-white').filter({ hasText: name });
    await expect(card.getByText('Image: Missing')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Browse' })).toBeVisible();
    await card.getByRole('button', { name: 'Generate Image' }).click();

    const dialog = page.getByRole('dialog', { name: 'Generate image for' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(name)).toBeVisible();
    await expect(dialog.getByRole('status')).toContainText(/Creating a beautiful image|Generating/i);
    await expect(dialog.getByRole('button', { name: 'Use Image' })).toBeVisible({ timeout: 90_000 });
    await dialog.getByRole('button', { name: 'Use Image' }).click();

    await expect(page.getByText('Image: Available').first()).toBeVisible({ timeout: 15_000 });

    await page.goto('/admin/media');
    await expect(page.locator('img').first()).toBeVisible({ timeout: 15_000 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await page.goto(`/specialities/${slug}`);
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.getByRole('img', { name: /cardiology/i })).toBeVisible();
  });
});
