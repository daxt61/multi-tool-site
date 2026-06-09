import { test, expect } from '@playwright/test';

test.describe('New Inspired Tools Smoke Tests', () => {
  const BASE_URL = 'http://localhost:5173';

  test('Palindromic Number Generator works', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/palindromic-number-generator`);
    await expect(page.locator('h1')).toContainText('Palindromic Numbers');

    // Test range generation
    await page.fill('input[type="number"] >> nth=0', '10');
    await page.fill('input[type="number"] >> nth=1', '100');
    await page.click('button:has-text("Generate")');

    // Check results (11, 22, 33, 44, 55, 66, 77, 88, 99)
    await expect(page.locator('span.select-all').first()).toContainText('11');
    await expect(page.locator('span.select-all').last()).toContainText('99');
  });

  test('ASCII to Decimal Converter works', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/ascii-decimal`);
    await expect(page.locator('h1')).toContainText('ASCII to Decimal');

    // Encode
    await page.fill('#ascii-text', 'ABC');
    await expect(page.locator('#decimal-output')).toHaveValue('65 66 67');

    // Decode
    await page.fill('#decimal-output', '72 73');
    await expect(page.locator('#ascii-text')).toHaveValue('HI');
  });

  test('Binary Bit Shifter works', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/binary-bit-shifter`);
    await expect(page.locator('h1')).toContainText('Binary Bit Shifter');

    // Input binary
    await page.fill('#bit-input', '1100');
    // Shift left by 1 (default is 1)
    // 1100 -> 1000
    await expect(page.locator('div.break-all')).toContainText('1000');

    // Change to Rotate Right
    await page.click('button:has-text("Rotate Right (ROR)")');
    // 1100 ROR 1 -> 0110
    await expect(page.locator('div.break-all')).toContainText('0110');
  });
});
