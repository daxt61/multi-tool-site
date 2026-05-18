import { test, expect } from '@playwright/test';

test.describe('Unicode Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/unicode-inspector');
  });

  test('should inspect characters correctly', async ({ page }) => {
    await page.fill('#unicode-input', '');
    await page.fill('#unicode-input', 'A');

    // Check for 'A'
    const charA = page.getByTestId('char-card').filter({ hasText: 'U+0041' });
    await expect(charA).toBeVisible();
    await expect(charA.getByRole('button', { name: 'DEC 65' })).toBeVisible();
    await expect(charA.getByRole('button', { name: 'HTML &#65;' })).toBeVisible();

    await page.fill('#unicode-input', '👋');
    // Check for 👋 (U+1F44B)
    const charEmoji = page.getByTestId('char-card').filter({ hasText: 'U+1F44B' });
    await expect(charEmoji).toBeVisible();
    await expect(charEmoji.getByRole('button', { name: 'DEC 128075' })).toBeVisible();
    await expect(charEmoji.getByRole('button', { name: 'HTML &#128075;' })).toBeVisible();
  });

  test('should clear input', async ({ page }) => {
    await page.fill('#unicode-input', 'Test');
    await page.click('button:has-text("Clear")');
    await expect(page.locator('#unicode-input')).toHaveValue('');
    await expect(page.getByTestId('char-card')).toHaveCount(0);
  });
});
