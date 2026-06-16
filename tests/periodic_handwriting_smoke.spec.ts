import { test, expect } from '@playwright/test';

test.describe('New Tools Smoke Test', () => {
  test('Periodic Table tool loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/periodic-table');
    await expect(page.locator('h1')).toContainText(/Periodic Table/i);
    // Use first() to avoid strict mode violation if multiple elements match
    await expect(page.locator('button:has-text("H")').first()).toBeVisible();
  });

  test('Text to Handwriting tool loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/text-to-handwriting');
    await expect(page.locator('h1')).toContainText(/Text to Handwriting/i);
    await expect(page.locator('canvas')).toBeVisible();
  });
});
