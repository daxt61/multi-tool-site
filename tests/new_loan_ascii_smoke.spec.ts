import { test, expect } from '@playwright/test';

test('Loan Comparison tool is registered and loads', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/loan-comparison');
  await expect(page.locator('h1')).toContainText('Loan Comparison');
});

test('ASCII Art Generator font styles work', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/ascii-art');
  const fontSelect = page.locator('#font-select');

  await fontSelect.selectOption('Mini');
  await expect(page.locator('pre')).toBeVisible();

  await fontSelect.selectOption('Bubble');
  await expect(page.locator('pre')).toBeVisible();

  await fontSelect.selectOption('Digital');
  await expect(page.locator('pre')).toBeVisible();
});
