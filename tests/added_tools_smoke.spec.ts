import { test, expect } from '@playwright/test';

test('World Clock is registered and loads', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/world-clock');
  await expect(page.locator('h1')).toContainText('World Clock');
});

test('Pro Stopwatch is registered and loads', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/stopwatch-pro');
  await expect(page.locator('h1')).toContainText('Pro Stopwatch');
});

test('Unicode Table is registered and loads', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/unicode-table');
  await expect(page.locator('h1')).toContainText('Unicode Table');
});
