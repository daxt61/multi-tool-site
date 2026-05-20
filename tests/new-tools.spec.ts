import { test, expect } from '@playwright/test';

test.describe('New Tools Integration', () => {
  test('Text Splitter should split text correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/text-splitter');

    // Test splitting by characters
    await page.fill('#split-input', 'ABCDEF');
    await page.fill('#split-value', '2');

    await expect(page.getByText('Chunk #1')).toBeVisible();
    await expect(page.locator('pre').first()).toContainText('AB');
    await expect(page.getByText('Chunk #2')).toBeVisible();
    await expect(page.locator('pre').nth(1)).toContainText('CD');
  });

  test('String Joiner should join lines correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/string-joiner');

    await page.fill('#join-input', 'Line 1\nLine 2');
    await page.fill('#join-separator', ' | ');

    const output = await page.inputValue('#join-output');
    expect(output).toBe('Line 1 | Line 2');
  });

  test('JSON Analyzer should provide correct stats', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-analyzer');

    const json = JSON.stringify({
      id: 1,
      name: "Test",
      active: true,
      tags: ["A", "B"]
    });

    await page.fill('#json-input', json);

    // Check key count (id, name, active, tags)
    await expect(page.getByText('4', { exact: true }).first()).toBeVisible();

    // Check type distribution labels
    await expect(page.getByText('Strings', { exact: true })).toBeVisible();
    await expect(page.getByText('Numbers', { exact: true })).toBeVisible();
  });
});
