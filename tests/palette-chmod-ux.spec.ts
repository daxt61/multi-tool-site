import { test, expect } from '@playwright/test';

test.describe('ChmodCalculator UX and Accessibility Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Chmod Calculator
    await page.goto('http://localhost:5173/en/outil/chmod');
  });

  test('should display visual shortcut hint for Esc', async ({ page }) => {
    // Check that standard Kbd component renders Esc hint
    const escHint = page.locator('kbd:has-text("Esc")');
    await expect(escHint).toBeVisible();
  });

  test('should clear permissions and focus the first permission button on Escape keypress', async ({ page }) => {
    // Get the first permission button of the grid (under .space-y-3 container)
    const firstButton = page.locator('.space-y-3 button').first();
    await expect(firstButton).toBeVisible();

    // Verify first button is active/pressed initially
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify first button is now not pressed (cleared)
    await expect(firstButton).toHaveAttribute('aria-pressed', 'false');

    // Verify first button is now focused programmatically
    await expect(firstButton).toBeFocused();
  });

  test('should clear permissions and focus the first permission button on clear button click', async ({ page }) => {
    const firstButton = page.locator('.space-y-3 button').first();
    await expect(firstButton).toBeVisible();

    // Click the clear button (Effacer tout / Clear all)
    const clearButton = page.locator('button:has-text("Clear all"), button:has-text("Effacer tout")').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify first button is now not pressed
    await expect(firstButton).toHaveAttribute('aria-pressed', 'false');

    // Verify firstButton is focused
    await expect(firstButton).toBeFocused();
  });

  test('should trigger copy action and trigger toast notification', async ({ page }) => {
    // Click copy button on the octal display card
    const copyButton = page.locator('button[aria-label^="Copy -"], button[aria-label^="Copier -"]').first();
    await expect(copyButton).toBeVisible();

    // Copy to clipboard mock
    await page.evaluate(() => {
      (window as any).clipboardText = '';
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    await copyButton.click();

    // Expect Sonner toast success message (text containing Copied or Copié)
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });
});
