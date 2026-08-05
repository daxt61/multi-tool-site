import { test, expect } from '@playwright/test';

test.describe('Sentinel PasswordStrengthMeter Security and UX Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Password Strength Meter tool
    await page.goto('http://localhost:5173/en/outil/password-strength');
  });

  test('should enforce MAX_LENGTH limit of 128 characters on the input field', async ({ page }) => {
    const input = page.locator('#password-input');
    await expect(input).toBeVisible();

    // Type/Paste a password that is 150 characters long
    const longPassword = 'a'.repeat(150);
    await input.fill(longPassword);

    // Verify input natively caps length at 128 characters
    const val = await input.inputValue();
    expect(val.length).toBe(128);
    expect(val).toBe('a'.repeat(128));
  });

  test('should not initialize password from URL query parameters', async ({ page }) => {
    // Navigate with a password pre-set in URL parameter if state sharing attempted to leak it
    await page.goto('http://localhost:5173/en/outil/password-strength?password=LeakMeIfYouCan');
    const input = page.locator('#password-input');
    await expect(input).toBeVisible();

    // Verify input is empty, and not loaded from URL state
    const val = await input.inputValue();
    expect(val).toBe('');
  });
});
