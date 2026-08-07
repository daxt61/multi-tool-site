import { test, expect } from '@playwright/test';

test.describe('Sentinel HTML to Markdown E2E Tests', () => {
  test('Correctly strips script and style content to prevent code leakage', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/html-to-markdown');

    // Wait for the HTML input field to load
    const inputArea = page.locator('#html-input');
    await expect(inputArea).toBeVisible();

    // Fill with content containing normal tags, scripts, and styles
    await inputArea.fill('<p>Hello <script>alert(1)</script>World <style>body{color:red;}</style>!</p>');

    // Check parsed Markdown output
    const outputArea = page.locator('#markdown-output');
    await expect(outputArea).toBeVisible();

    const outputValue = await outputArea.inputValue();
    expect(outputValue.trim()).toBe('Hello World !');

    // Ensure it does not contain the inner contents of script and style tags
    expect(outputValue).not.toContain('alert(1)');
    expect(outputValue).not.toContain('body{color:red;}');
  });

  test('Enforces maximum input length of 100,000 characters and shows error alert', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/html-to-markdown');

    const inputArea = page.locator('#html-input');
    await expect(inputArea).toBeVisible();

    // Build string of 100,005 characters
    const longInput = '<p>' + 'a'.repeat(100000) + '</p>';
    await inputArea.fill(longInput);

    // Verify error is displayed
    const errorAlert = page.locator('div.bg-rose-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Input is too long. Limit of 100,000 characters.');

    // Output should be empty when limit is exceeded
    const outputArea = page.locator('#markdown-output');
    await expect(outputArea).toHaveValue('');

    // Clear input using Reset/Clear button and verify error is gone
    await page.click('button:has-text("Clear")');
    await expect(errorAlert).not.toBeVisible();
  });

  test('Performs keyboard shortcuts and programmatic focus restoration', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/html-to-markdown');

    const inputArea = page.locator('#html-input');
    await inputArea.fill('<div>Shortcut Test</div>');

    // Defocus elements by clicking a label or header
    await page.click('h4:has-text("About HTML to Markdown")');

    // Press Escape to reset input
    await page.keyboard.press('Escape');

    // Input should be empty
    await expect(inputArea).toHaveValue('');

    // Focus should be restored to the input textarea
    await expect(inputArea).toBeFocused();

    // Verify reset success toast was shown
    const toastLocator = page.locator('[data-sonner-toast]');
    await expect(toastLocator.first()).toBeVisible();
    await expect(toastLocator.first()).toContainText('Input and output cleared');
  });

  test('Copies output using keyboard shortcut C when not focused on editables', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/html-to-markdown');

    const inputArea = page.locator('#html-input');
    await inputArea.fill('<p>Hello World</p>');

    // Defocus elements by clicking a header
    await page.click('h4:has-text("About HTML to Markdown")');

    // Press C to copy output
    await page.keyboard.press('c');

    // Verify copy success toast was shown
    const toastLocator = page.locator('[data-sonner-toast]');
    await expect(toastLocator.first()).toBeVisible();
    await expect(toastLocator.first()).toContainText('Successfully copied Markdown output!');
  });
});
