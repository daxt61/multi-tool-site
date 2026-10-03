import { test, expect } from '@playwright/test';

test.describe('Aspect Ratio Calculator Keyboard Shortcuts and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Go to French path for the tool
    await page.goto('http://localhost:5173/fr/outil/aspect-ratio');
  });

  test('should clear inputs and focus width when Escape is pressed', async ({ page }) => {
    const widthInput = page.locator('#width');
    const heightInput = page.locator('#height');

    await widthInput.fill('1280');
    await heightInput.fill('720');

    await widthInput.focus();
    await page.keyboard.press('Escape');

    await expect(widthInput).toHaveValue('');
    await expect(heightInput).toHaveValue('');
    await expect(widthInput).toBeFocused();
  });

  test('should copy result format when C is pressed', async ({ page }) => {
    const widthInput = page.locator('#width');
    const heightInput = page.locator('#height');

    await widthInput.fill('1920');
    await heightInput.fill('1080');

    // Blur active elements to allow global shortcut
    await widthInput.blur();
    await heightInput.blur();

    // Press C
    await page.keyboard.press('c');

    // Check for success feedback (Check icon instead of Copy icon on the format copy button)
    const copyButton = page.locator('button[aria-label*="Copier"]');
    await expect(copyButton.first()).toBeVisible();

    // After pressing C, it should show the Check icon
    await expect(copyButton.first().locator('svg')).toHaveClass(/lucide-check/);
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ }).first()).toBeAttached();
  });

  test('should mark active preset with aria-pressed state', async ({ page }) => {
    // 16:9 preset button should be active by default since initial ratio is 16:9
    const preset169 = page.locator('button[aria-label*="16:9"]');
    await expect(preset169).toHaveAttribute('aria-pressed', 'true');

    // Click 1:1 preset
    const preset11 = page.locator('button[aria-label*="1:1"]');
    await preset11.click();

    await expect(preset11).toHaveAttribute('aria-pressed', 'true');
    await expect(preset169).toHaveAttribute('aria-pressed', 'false');
  });
});
