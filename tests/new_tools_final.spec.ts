import { test, expect } from '@playwright/test';

test.describe('New Tools Smoke Test', () => {
  test('should load Word Cloud Generator and generate cloud', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/word-cloud');
    await expect(page.getByRole('heading', { name: 'Word Cloud Generator', exact: true })).toBeVisible();

    const input = page.locator('#wordcloud-input');
    await input.fill('hello world hello hello test word cloud');

    // Check if canvas exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should load Text Hex Dump and generate output', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/hex-dump');
    await expect(page.getByRole('heading', { name: 'Text Hex Dump' })).toBeVisible();

    const input = page.locator('#hexdump-input');
    await input.fill('Jules is here');

    const output = page.locator('pre');
    await expect(output).toContainText('4A 75 6C 65 73'); // 'Jules' in hex
  });

  test('should test upgraded JSON to TS features', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-ts');

    const input = page.locator('#json-input');
    await input.fill('{"id": 1}');

    const rootNameInput = page.locator('#root-name');
    await rootNameInput.fill('MyCustomRoot');

    const output = page.locator('#ts-output');
    await expect(output).toContainText('interface MyCustomRoot');

    await page.getByRole('button', { name: 'Type' }).click();
    await expect(output).toContainText('type MyCustomRoot = {');
  });
});
