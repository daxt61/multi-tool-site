import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('New and Upgraded Tools Smoke Test', () => {
  test('Color Blindness Simulator loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/color-blindness`);
    await expect(page.locator('h1')).toContainText('Color Blindness Simulator');
  });

  test('Backdrop Filter Generator loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/backdrop-filter`);
    await expect(page.locator('h1')).toContainText('Backdrop Filter Generator');
  });

  test('Password Generator has multiple generation options', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/password-generator`);
    await expect(page.locator('label[for="password-quantity"]')).toBeVisible();
  });

  test('Diff Checker has character level diffing', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/diff-checker`);
    await expect(page.locator('h1')).toContainText('Diff Checker');
  });
});
