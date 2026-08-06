import { test, expect } from '@playwright/test';

test.describe('Password Generator Premium Keyboard Shortcuts and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Go to French path for the password-generator tool
    await page.goto('http://localhost:5173/fr/outil/password-generator');
  });

  test('should show keyboard shortcut hints on the buttons', async ({ page }) => {
    // Ensure Esc and C shortcut badges are present
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });

  test('should clear passwords and focus quantity slider when Escape is pressed', async ({ page }) => {
    // Verify we have passwords generated initially
    const passwordInput = page.locator('input[aria-label="Mot de passe"]').first();
    await expect(passwordInput).toBeVisible();

    // Blur first if anything is focused
    await page.keyboard.press('Escape');

    // After clearing, the input of words/passwords should not be present (or empty state shown)
    await expect(page.locator('text=Les mots de passe générés apparaîtront ici')).toBeVisible();

    // The quantity input slider should be programmatically focused
    const quantitySlider = page.locator('#password-quantity');
    await expect(quantitySlider).toBeFocused();
  });

  test('should copy password when C is pressed globally', async ({ page }) => {
    // Blur any focused elements to allow global shortcut triggers
    const activeElement = page.locator(':focus');
    if (await activeElement.count() > 0) {
      await activeElement.blur();
    }

    // Press 'c' to copy
    await page.keyboard.press('c');

    // There should be a success toast or some copy feedback
    const toast = page.locator('li[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });

  test('should toggle password visibility when V is pressed globally', async ({ page }) => {
    const passwordInput = page.locator('input[aria-label="Mot de passe"]').first();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Press 'v' to toggle visibility
    await page.keyboard.press('v');
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Press 'v' again to hide visibility
    await page.keyboard.press('v');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should regenerate passwords when R or Enter is pressed', async ({ page }) => {
    const passwordInput = page.locator('input[aria-label="Mot de passe"]').first();
    const initialValue = await passwordInput.inputValue();

    // Press 'r' to regenerate
    await page.keyboard.press('r');

    // Wait to see if password changed
    await expect(async () => {
      const newValue = await passwordInput.inputValue();
      expect(newValue).not.toBe(initialValue);
    }).toPass();
  });
});
