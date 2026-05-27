import { test, expect } from '@playwright/test';

test.describe('New Inspired Tools', () => {
  test('Words to Numbers tool should be functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/words-to-numbers');
    await page.waitForSelector('textarea#words-input');

    await page.fill('textarea#words-input', 'one hundred twenty three');
    // Wait for the result to update. It uses useMemo so it should be fast.
    await expect(page.locator('text=123')).toBeVisible();
  });

  test('Pi Digits tool should be functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/pi-generator');
    // The default is 100 digits
    await expect(page.locator('text=3.1415926535')).toBeVisible();
  });

  test('Average Time tool should be functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/average-time');
    await page.waitForSelector('textarea#times-input');

    await page.fill('textarea#times-input', '10:00\n12:00');
    await expect(page.locator('text=11:00:00')).toBeVisible();
  });

  test('Image Color Replacer tool should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/image-color-replacer');
    await expect(page.locator('text=Upload an image to start')).toBeVisible();
  });
});
