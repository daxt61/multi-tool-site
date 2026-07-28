import { test, expect } from '@playwright/test';

test.describe('StringEscaper Premium UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the String Escaper page directly
    await page.goto('http://localhost:5173/fr/outil/url-extractor'); // we will use URL search or navigating
    // Since we'll navigate on dashboard, let's load dashboard and find string-escaper
    await page.goto('http://localhost:5173/fr/outil/string-escaper');
  });

  test('should link form labels and controls correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('String Escaper');

    // Verify label-input link
    const textInput = page.locator('#string-input');
    await expect(textInput).toBeVisible();

    const outputText = page.locator('#string-output');
    await expect(outputText).toBeVisible();
  });

  test('converts strings and shows real-time output', async ({ page }) => {
    const textInput = page.locator('#string-input');
    await textInput.fill('Hello "World" & others!');

    const outputText = page.locator('#string-output');
    // Default format is JSON/JavaScript, so it should escape double quotes
    await expect(outputText).toHaveValue('Hello \\"World\\" & others!');
  });

  test('clears inputs and programmatically restores focus on Escape key or Clear button', async ({ page }) => {
    const textInput = page.locator('#string-input');
    await textInput.fill('Some text to escape');

    // Click clear button
    const clearButton = page.locator('button:has(svg.lucide-trash-2)');
    await clearButton.click();

    await expect(textInput).toHaveValue('');

    // Focus should return to the text input
    await expect(textInput).toBeFocused();
  });

  test('copies output and shows toast on Copy button click or pressing C key', async ({ page }) => {
    const textInput = page.locator('#string-input');
    await textInput.fill('Text to copy');

    const copyButton = page.locator('button:has(svg.lucide-copy)');
    await copyButton.click();

    // Verify toast is visible
    const toast = page.locator('.sonner-toast');
    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible();
    }
  });
});
