import { test, expect } from '@playwright/test';

test.describe('Body Fat Calculator Keyboard Shortcuts and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Go to French path for the body fat calculator
    await page.goto('http://localhost:5173/fr/outil/body-fat-calculator');
  });

  test('should display visual elements, categories, and load correct default values', async ({ page }) => {
    const heightInput = page.locator('#height');
    const weightInput = page.locator('#weight');

    await expect(heightInput).toHaveValue('180');
    await expect(weightInput).toHaveValue('75');

    // Default calculated value with male/180/75/38/85 should be 16.1%
    const bfPercentage = page.locator('.text-6xl, .text-8xl');
    await expect(bfPercentage).toContainText('16.1');
  });

  test('should clear inputs and focus height when Escape is pressed on the focused inputs', async ({ page }) => {
    const heightInput = page.locator('#height');

    await heightInput.focus();
    await page.keyboard.press('Escape');

    // Values should be cleared
    await expect(heightInput).toHaveValue('');
    await expect(heightInput).toBeFocused();
  });

  test('should copy result when C is pressed', async ({ page }) => {
    const heightInput = page.locator('#height');

    // Blur to trigger global shortcut (not typing)
    await heightInput.blur();

    // Press C
    await page.keyboard.press('c');

    // Check for success feedback (Check icon instead of Copy icon)
    const copyButton = page.locator('button[aria-label="Copier (C)"]');
    await expect(copyButton).toBeVisible();
    await expect(copyButton.locator('svg')).toHaveClass(/lucide-check/);
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    // Ensure Esc and C hotkey indicators are visible
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
