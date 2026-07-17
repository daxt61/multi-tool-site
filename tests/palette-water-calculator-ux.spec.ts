import { test, expect } from '@playwright/test';

test.describe('Water Calculator Keyboard Shortcuts and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Go to French path for the tool
    await page.goto('http://localhost:5173/fr/outil/water-calculator');
  });

  test('should clear inputs and focus weight when Escape is pressed', async ({ page }) => {
    const weightInput = page.locator('#weight');

    await weightInput.fill('85');

    await weightInput.focus();
    await page.keyboard.press('Escape');

    await expect(weightInput).toHaveValue('');
    await expect(weightInput).toBeFocused();
  });

  test('should copy result when C is pressed', async ({ page }) => {
    const weightInput = page.locator('#weight');
    await weightInput.fill('70');

    // Expected needs: 70 * 35 + 500 (moderate) = 2950 => 2.95
    await expect(page.locator('.text-6xl')).toHaveText('2.95');

    // Blur from input to allow global shortcut
    await weightInput.blur();

    // Press C
    await page.keyboard.press('c');

    // Check for success feedback (Check icon instead of Copy icon)
    const copyButton = page.locator('button[aria-label="Copier (C)"]');
    await expect(copyButton).toBeVisible();

    // After pressing C, it should show the Check icon
    await expect(copyButton.locator('svg')).toHaveClass(/lucide-check/);
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
