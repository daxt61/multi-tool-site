import { test, expect } from '@playwright/test';

test.describe('Base64 to Image Keyboard Shortcuts and UX', () => {
  test('English: should load, clear inputs, and manage focus and keyboard shortcuts', async ({ page }) => {
    // Go to English path for the tool
    await page.goto('http://localhost:5173/en/outil/base64-to-image');

    // Verify label and header in English
    await expect(page.locator('label[for="base64-input"]')).toHaveText('Base64 Image String');
    await expect(page.locator('p:has-text("Paste a Base64 string")')).toBeVisible();

    const textarea = page.locator('#base64-input');
    await textarea.fill('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

    // Focus the textarea and press Escape
    await textarea.focus();
    await page.keyboard.press('Escape');

    // Textarea should be empty and refocused
    await expect(textarea).toHaveValue('');
    await expect(textarea).toBeFocused();
  });

  test('French: should load and translate text correctly', async ({ page }) => {
    // Go to French path for the tool
    await page.goto('http://localhost:5173/fr/outil/base64-to-image');

    // Verify label and empty state in French
    await expect(page.locator('label[for="base64-input"]')).toHaveText("Chaîne Base64 de l'Image");
    await expect(page.locator('p:has-text("Collez une chaîne Base64")')).toBeVisible();
  });

  test('should trigger copy and show toast/success icon when C is pressed', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/base64-to-image');

    const textarea = page.locator('#base64-input');
    // Fill with a valid PNG Base64 string
    await textarea.fill('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

    // Blur to test the global 'C' key listener
    await textarea.blur();
    await page.keyboard.press('c');

    // Toast notification should be visible (e.g. from Sonner)
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();

    // The copy button should show the checkmark / copied text
    const copiedBtn = page.locator('button[title*="Copy Data URL"]');
    await expect(copiedBtn).toBeVisible();
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/base64-to-image');
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
  });
});
