import { test, expect } from '@playwright/test';

test.describe('Sentinel PasswordAnalyzer Security and UX Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Password Analyzer tool
    await page.goto('http://localhost:5173/en/outil/password-analyzer');
  });

  test('should display proper label matching the password input', async ({ page }) => {
    const label = page.locator('label[for="pwd-analyzer"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText('Enter password to analyze');
  });

  test('should enforce MAX_LENGTH limit of 128 characters on the input field', async ({ page }) => {
    const input = page.locator('#pwd-analyzer');
    await expect(input).toBeVisible();

    // Type/Paste a password that is 150 characters long
    const longPassword = 'a'.repeat(150);
    await input.fill(longPassword);

    // Verify input natively caps length at 128 characters
    const val = await input.inputValue();
    expect(val.length).toBe(128);
    expect(val).toBe('a'.repeat(128));
  });

  test('should trigger copy action and show toast notification', async ({ page }) => {
    const input = page.locator('#pwd-analyzer');
    await input.focus();
    await page.keyboard.type('SecureP@ss123!');

    // Mock clipboard API
    await page.evaluate(() => {
      (window as any).clipboardText = '';
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    // Locate copy button (button with class or descriptive attributes)
    const copyButton = page.locator('button:has(svg.lucide-copy)').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify Sonner toast is shown
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });

  test('should clear password input on Escape keypress when focused', async ({ page }) => {
    const input = page.locator('#pwd-analyzer');
    await input.focus();
    await page.keyboard.type('SecretCode!');

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify input is cleared
    await expect(input).toHaveValue('');
    // Verify focus remains
    await expect(input).toBeFocused();
  });
});
