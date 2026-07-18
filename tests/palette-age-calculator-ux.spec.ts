import { test, expect } from '@playwright/test';

test.describe('Age Calculator Keyboard Shortcuts and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Age Calculator page
    await page.goto('http://localhost:5173/en/outil/age-calculator');
  });

  test('should clear input and restore focus when Escape is pressed', async ({ page }) => {
    const birthDateInput = page.locator('#birth-date');

    // Fill birthdate
    await birthDateInput.fill('1995-05-15');
    await expect(birthDateInput).toHaveValue('1995-05-15');

    // Focus input and press Escape
    await birthDateInput.focus();
    await page.keyboard.press('Escape');

    // Check it is empty and focused
    await expect(birthDateInput).toHaveValue('');
    await expect(birthDateInput).toBeFocused();
  });

  test('should copy current age when C is pressed', async ({ page }) => {
    const birthDateInput = page.locator('#birth-date');
    await birthDateInput.fill('1990-01-01');

    // Setup clipboard spy
    await page.evaluate(() => {
      (window as any).clipboardText = "";
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    // Blur to trigger global shortcut
    await birthDateInput.blur();

    // Press C
    await page.keyboard.press('c');

    // Verify copy indicator button is updated to check icon
    const copyButton = page.locator('button[aria-label="Copy current age"]');
    await expect(copyButton).toBeVisible();
    await expect(copyButton.locator('svg')).toHaveClass(/lucide-check/);

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => (window as any).clipboardText);
    expect(clipboardText).toContain('years');
  });

  test('should copy report when R is pressed', async ({ page }) => {
    const birthDateInput = page.locator('#birth-date');
    await birthDateInput.fill('1990-01-01');

    // Setup clipboard spy
    await page.evaluate(() => {
      (window as any).clipboardText = "";
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    // Blur to trigger global shortcut
    await birthDateInput.blur();

    // Press R
    await page.keyboard.press('r');

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => (window as any).clipboardText);
    expect(clipboardText).toContain('Age Report');
    expect(clipboardText).toContain('Life Statistics');
  });

  test('should display Kbd hints for shortcuts', async ({ page }) => {
    // Check standard Kbd hints are rendered
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
    await expect(page.locator('kbd', { hasText: /^R$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^D$/ })).toBeVisible();
  });
});
