import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Cipher Tools', () => {
  test('Atbash Cipher basic functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/atbash-cipher`);
    const input = page.locator('#atbash-input');
    await input.fill('abc ABC');
    const result = page.locator('div.font-mono');
    await expect(result).toContainText('zyx ZYX');
  });

  test('Rail Fence Cipher basic functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/rail-fence-cipher`);
    const input = page.locator('#rail-input');
    await input.fill('HELLO WORLD');
    const result = page.locator('div.font-mono');
    await expect(result).not.toBeEmpty();
  });

  test('Vigenere Cipher enhancements', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/vigenere-cipher`);
    const keyInput = page.locator('#vigenere-key');
    await keyInput.fill('KEY');
    const input = page.locator('#vigenere-input');
    await input.fill('HELLO');
    const result = page.locator('#vigenere-output');
    await expect(result).toContainText('RIJVS');

    // Test Reset
    await page.keyboard.press('Escape');
    await expect(input).toBeEmpty();
    await expect(keyInput).toBeEmpty();
  });

  test('Cesar Cipher enhancements', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/cesar-cipher`);
    const input = page.locator('#input-text');
    await input.fill('ABC');
    // Default shift 3
    const result = page.locator('div.font-mono');
    await expect(result).toContainText('DEF');

    // Test Reset
    await page.keyboard.press('Escape');
    await expect(input).toBeEmpty();
  });
});
