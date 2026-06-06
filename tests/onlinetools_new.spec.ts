import { test, expect } from '@playwright/test';

test.describe('New Inspired Tools Smoke Tests', () => {
  test('Hilbert Curve tool is accessible and renders', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/hilbert-curve');
    await expect(page.locator('h1')).toContainText('Hilbert Curve');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('JSON Obfuscator tool is accessible and works', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-obfuscator');
    await expect(page.locator('h1')).toContainText('JSON Obfuscator');

    const input = page.locator('#json-input');
    await input.fill('{"hello": "world"}');

    // Wait for debounce
    await page.waitForTimeout(600);

    const output = page.locator('pre');
    const text = await output.textContent();
    expect(text).toContain('_0x');
    expect(text).not.toContain('"hello"');
  });

  test('Word Shuffler tool is accessible and works', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/word-shuffler');
    await expect(page.locator('h1')).toContainText('Word Shuffler');

    const input = page.locator('#word-input');
    const testText = 'the quick brown fox jumps over the lazy dog';
    await input.fill(testText);

    // Wait for debounce
    await page.waitForTimeout(500);

    const output = page.locator('.whitespace-pre-wrap');
    const shuffledText = await output.textContent();

    expect(shuffledText).not.toBe(testText);
    // Should have same words
    const originalWords = testText.split(' ').sort();
    const shuffledWords = shuffledText?.trim().split(' ').sort();
    expect(shuffledWords).toEqual(originalWords);
  });
});
