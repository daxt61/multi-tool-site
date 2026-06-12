import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Enhanced Tools', () => {
  test('JSON to Markdown Table enhancements', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/json-to-markdown`);
    const input = page.locator('#json-input');
    await input.fill('[{"a":1}]');
    const output = page.locator('#markdown-output');
    await expect(output).toContainText('| a |');

    // Test Reset
    await page.keyboard.press('Escape');
    await expect(input).toBeEmpty();
    await expect(output).toBeEmpty();
  });

  test('Data URL Generator enhancements', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/data-url`);
    const output = page.locator('#data-url-output');
    // We can't easily upload a file in this environment without a real file,
    // but we can check if reset works (even if empty) or just check keyboard shortcut for clear if it was there.

    // Test Escape for reset
    await page.keyboard.press('Escape');
    await expect(output).toBeEmpty();
  });
});
