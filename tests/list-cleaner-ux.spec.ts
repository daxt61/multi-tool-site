import { test, expect } from '@playwright/test';

test.describe('List Cleaner Premium UX', () => {
  test('should support keyboard shortcuts, correct labels, and aria-hidden icons', async ({ page }) => {
    // Navigate to the list cleaner tool page
    await page.goto('http://localhost:5173/en/outil/list-cleaner');

    // Verify Title
    await expect(page.locator('h1')).toContainText('List Cleaner');

    // 1. Verify correct id and htmlFor (renders as 'for') pairings for Prefix & Suffix
    const prefixLabel = page.locator('label[for="cleaner-prefix"]');
    await expect(prefixLabel).toBeVisible();
    const prefixInput = page.locator('input#cleaner-prefix');
    await expect(prefixInput).toBeVisible();

    const suffixLabel = page.locator('label[for="cleaner-suffix"]');
    await expect(suffixLabel).toBeVisible();
    const suffixInput = page.locator('input#cleaner-suffix');
    await expect(suffixInput).toBeVisible();

    // 2. Verify decorative icons inside List Cleaner have aria-hidden="true"
    const svgIcons = page.locator('[data-testid="list-cleaner-container"] svg.lucide');
    const count = await svgIcons.count();
    for (let i = 0; i < count; i++) {
      const isHidden = await svgIcons.nth(i).getAttribute('aria-hidden');
      expect(isHidden).toBe('true');
    }

    // 3. Test keyboard shortcut clearing
    const inputArea = page.locator('#list-input');
    await inputArea.fill('item1\nitem2\nitem3');
    await page.waitForTimeout(100);

    // Escape triggers clear and focuses back to inputArea
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
