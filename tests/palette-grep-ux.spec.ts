import { test, expect } from '@playwright/test';

test.describe('TextGrep UX Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/text-grep');
  });

  test('should clear text and pattern using Escape key', async ({ page }) => {
    const patternInput = page.locator('input[placeholder="Enter search text..."]');
    const textInput = page.locator('textarea[placeholder="Paste your text here..."]');

    await patternInput.fill('test-pattern');
    await textInput.fill('test text\nline 2');

    await expect(patternInput).toHaveValue('test-pattern');
    await expect(textInput).toHaveValue('test text\nline 2');

    // Press Escape
    await page.keyboard.press('Escape');

    await expect(patternInput).toHaveValue('');
    await expect(textInput).toHaveValue('');
    await expect(patternInput).toBeFocused();
  });

  test('should copy results using C key', async ({ page }) => {
    const patternInput = page.locator('input[placeholder="Enter search text..."]');
    const textInput = page.locator('textarea[placeholder="Paste your text here..."]');

    await patternInput.fill('match');
    await textInput.fill('match line\nother line');

    // Mock clipboard
    await page.evaluate(() => {
      (window as any).clipboardData = "";
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardData = text;
      };
    });

    // Ensure we are not in an input
    await page.click('h1');
    await page.keyboard.press('c');

    const clipboardText = await page.evaluate(() => (window as any).clipboardData);
    expect(clipboardText).toBe('match line');
  });

  test('should have visible kbd hints and aria-labels', async ({ page }) => {
    const clearButton = page.locator('button[aria-label="Clear input and pattern"]');
    await expect(clearButton).toBeVisible();
    await expect(page.locator('kbd:has-text("Esc")').first()).toBeVisible();

    const copyButton = page.locator('button[aria-label="Copy matching lines"]');
    // Initially disabled because no matching lines
    await expect(copyButton).toBeDisabled();

    await page.locator('textarea[placeholder="Paste your text here..."]').fill('some text');
    await expect(copyButton).toBeVisible();
    await expect(page.locator('button[aria-label="Copy matching lines"] kbd:has-text("C")')).toBeVisible();

    const downloadButton = page.locator('button[aria-label="Download matching lines"]');
    await expect(downloadButton).toBeVisible();
    await expect(page.locator('kbd:has-text("D")')).toBeVisible();
  });
});
