import { test, expect } from '@playwright/test';

test('Gzip & Deflate Converter E2E Validation', async ({ page, baseURL }) => {
  // Navigate to English version of Gzip & Deflate tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/gzip-deflate`);

  const inputArea = page.locator('#gzip-input-text');
  const outputArea = page.locator('#gzip-output-text');

  // Verify elements exist
  await expect(inputArea).toBeVisible();
  await expect(outputArea).toBeVisible();

  // Test Case 1: Fill plain text input and check compression outputs Base64 by default
  const plainText = "Hello World! Gzip and Deflate testing with Jules.";
  await inputArea.fill(plainText);

  // Wait for processing
  await page.waitForTimeout(500);

  // Output should be generated as Base64 (which is standard compression format)
  const compressedBase64 = await outputArea.inputValue();
  expect(compressedBase64.length).toBeGreaterThan(0);
  expect(compressedBase64).not.toEqual(plainText);

  // Verify statistics panel appears
  const originalSizeStat = page.locator('text=Original Size');
  const compressedSizeStat = page.locator('text=Processed Size');
  await expect(originalSizeStat).toBeVisible();
  await expect(compressedSizeStat).toBeVisible();

  // Test Case 2: Decompress the generated Base64 back to plain text
  // Let's toggle mode to 'decompress'
  const decompressButton = page.locator('button:has-text("Decompress")');
  await decompressButton.click();

  // Change input format to 'base64' and output format to 'text'
  await page.selectOption('#gzip-input-format', 'base64');
  await page.selectOption('#gzip-output-format', 'text');

  // Fill input with the compressed Base64 we got earlier
  await inputArea.fill(compressedBase64);
  await page.waitForTimeout(500);

  // Output should match our original plain text
  const decompressedText = await outputArea.inputValue();
  expect(decompressedText).toEqual(plainText);

  // Test Case 3: Clear with Escape key shortcut
  await inputArea.focus();
  await page.keyboard.press('Escape');
  await expect(inputArea).toHaveValue('');
  await expect(outputArea).toHaveValue('');
});
