import { test, expect } from '@playwright/test';

test.describe('PasswordStrengthMeter UX and Accessibility Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Password Strength tool
    await page.goto('http://localhost:5173/en/outil/password-strength');
  });

  test('should display proper label matching the password input', async ({ page }) => {
    // Label should contain t('passwordgenerator.password') which is "Password" in English
    const label = page.locator('label[for="password-input"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText('Password');
  });

  test('should display visual shortcut hints for C and Esc', async ({ page }) => {
    const kbdC = page.locator('button[aria-label="Copy"] kbd, button[aria-label="Copier"] kbd').first();
    const kbdEsc = page.locator('.flex.gap-2.items-center kbd').last();
    await expect(kbdC).toBeVisible();
    await expect(kbdC).toHaveText('C');
    await expect(kbdEsc).toBeVisible();
    await expect(kbdEsc).toHaveText('Esc');
  });

  test('should clear password input and focus it on Escape keypress when focused', async ({ page }) => {
    const input = page.locator('#password-input');
    await expect(input).toBeVisible();

    // Type a password
    await input.focus();
    await page.keyboard.type('SecureP@ss123!');
    await expect(input).toHaveValue('SecureP@ss123!');

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify input is cleared
    await expect(input).toHaveValue('');

    // Verify input remains focused
    await expect(input).toBeFocused();
  });

  test('should trigger copy action and show toast notification', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.focus();
    await page.keyboard.type('SuperSecurePass!');

    // Mock clipboard API
    await page.evaluate(() => {
      (window as any).clipboardText = '';
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    // Locate copy button
    const copyButton = page.locator('button[aria-label="Copy"], button[aria-label="Copier"]').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify Sonner toast is shown
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });
});
