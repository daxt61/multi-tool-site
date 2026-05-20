import { test, expect } from '@playwright/test';

test.describe('BMI Calculator UX Enhancement', () => {
  test('should highlight active category in grid and result card', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/bmi-calculator');

    // Default weight: 70kg, height: 170cm => BMI: 24.2 (Normal)
    const resultContainer = page.locator('[aria-live="polite"]');
    await expect(resultContainer).toContainText('24.2');
    await expect(resultContainer).toContainText('Normal');

    // Check if the 'Normal' grid item is highlighted
    const normalGridItem = page.locator('div.border-indigo-500', { hasText: 'Normal' });
    await expect(normalGridItem).toBeVisible();
    await expect(normalGridItem).toContainText('18.5 - 25');

    // Change weight to trigger 'Overweight'
    await page.fill('#weight', '85');
    await expect(resultContainer).toContainText('29.4');
    await expect(resultContainer).toContainText('Overweight');

    const overweightGridItem = page.locator('div.border-indigo-500', { hasText: 'Overweight' });
    await expect(overweightGridItem).toBeVisible();
    await expect(overweightGridItem).toContainText('25 - 30');

    // Verify clear button focus
    await page.click('button[aria-label="Clear fields"]');
    await expect(page.locator('#weight')).toBeFocused();
    await expect(page.locator('#weight')).toHaveValue('');
  });
});
