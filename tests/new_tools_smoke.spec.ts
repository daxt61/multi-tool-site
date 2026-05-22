import { test, expect } from '@playwright/test';

test.describe('New Tools Smoke Test', () => {
  test('Bcrypt Generator loads and hashes', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/bcrypt-generator');
    await expect(page.locator('h1')).toContainText('Bcrypt Generator');

    await page.fill('#bcrypt-password', 'test-password');
    await page.click('button:has-text("Generate Hash")');

    const hashArea = page.locator('textarea').first();
    await expect(hashArea).toContainText('$2');
  });

  test('Color Extractor loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/color-extractor');
    await expect(page.locator('h1')).toContainText('Color Extractor');
    await expect(page.getByText('Upload an image to extract colors')).toBeVisible();
  });
});
