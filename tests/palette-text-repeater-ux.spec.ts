import { test, expect } from '@playwright/test';

test.describe('Text Repeater UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/text-repeater');
  });

  test('should load quick preset and calculate output correctly', async ({ page }) => {
    const input = page.locator('#text-input');
    const output = page.locator('#output-text');

    // Click on Echo Banner preset
    const echoPreset = page.getByRole('button', { name: /bannière écho|echo banner/i });
    await expect(echoPreset).toBeVisible();
    await echoPreset.click();

    // Verify input value and output text
    await expect(input).toHaveValue('ECHO ');
    await expect(output).toHaveValue('ECHO  ECHO  ECHO  ECHO  ECHO ');

    // Toast notification should appear
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();
  });

  test('should toggle separator buttons with correct aria-pressed attributes', async ({ page }) => {
    const spaceSep = page.getByRole('button', { name: /espace|space/i });
    await expect(spaceSep).toBeVisible();

    // Default separator is 'LF' (newline)
    await expect(spaceSep).toHaveAttribute('aria-pressed', 'false');

    await spaceSep.click();
    await expect(spaceSep).toHaveAttribute('aria-pressed', 'true');
  });

  test('should clear inputs and programmatically restore focus on Escape key', async ({ page }) => {
    const input = page.locator('#text-input');
    await input.fill('Repeat Me');

    // Focus input and press Escape
    await input.focus();
    await page.keyboard.press('Escape');

    // Verify input is empty and focused
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('should copy output and show toast when pressing C key outside editables', async ({ page }) => {
    const input = page.locator('#text-input');
    await input.fill('Copy Test');

    // Blur editable input
    await input.blur();

    // Press 'C' key
    await page.keyboard.press('c');

    // Verify toast appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();
  });
});
