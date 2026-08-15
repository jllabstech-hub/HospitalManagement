import { test, expect } from './fixtures/test';

test.describe('Global Interactive Search E2E Suite', () => {
  test('Desktop & Mobile Interactive Search flow without Search button', async ({ page }) => {
    // 1. Open Homepage
    await page.goto('/');

    // 2. Click Header Search Trigger Button
    await page.click('button:has-text("Search")');
    await expect(page.locator('input[aria-label="Global interactive hospital search"]')).toBeVisible();

    // 3. Type "card" and verify results begin appearing automatically (NO click on Search button)
    await page.fill('input[aria-label="Global interactive hospital search"]', 'card');
    await expect(page.getByText(/Cardiology/i).first()).toBeVisible({ timeout: 10000 });

    // 4. Type "cardiology" and verify results update
    await page.fill('input[aria-label="Global interactive hospital search"]', 'cardiology');
    await expect(page.getByText('Cardiology').first()).toBeVisible();

    // 5. Clear query using clear button
    await page.click('button[title="Clear query"]');
    await expect(page.locator('input[aria-label="Global interactive hospital search"]')).toHaveValue('');

    // 6. Test Keyboard Navigation (Escape key closes overlay)
    await page.keyboard.press('Escape');
    await expect(page.locator('input[aria-label="Global interactive hospital search"]')).not.toBeVisible();
  });

  test('Mobile Viewport Interactive Search without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Open Search overlay
    await page.click('button:has-text("Search")');
    await expect(page.locator('input[aria-label="Global interactive hospital search"]')).toBeVisible();

    // Type query
    await page.fill('input[aria-label="Global interactive hospital search"]', 'Smith');
    const jane = page.getByText('Dr. Jane Smith').first();
    await jane.scrollIntoViewIfNeeded();
    await expect(jane).toBeVisible({ timeout: 10000 });

    // Verify no horizontal scrollbar / overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
