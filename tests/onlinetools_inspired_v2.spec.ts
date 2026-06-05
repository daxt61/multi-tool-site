import { test, expect } from '@playwright/test';

test.describe('More OnlineTools Inspired Tools', () => {
  test('Letter Shuffler loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/letter-shuffler');
    await expect(page.locator('h1')).toContainText('Letter Shuffler');
    await page.getByLabel('Text to shuffle').fill('test');
    await page.getByRole('button', { name: 'Shuffle' }).click();
    await expect(page.locator('#shuffler-output')).not.toBeEmpty();
  });

  test('Date Sorter loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/date-sorter');
    await expect(page.locator('h1')).toContainText('Date Sorter');
    await page.getByLabel('Dates (one per line)').fill('2023-01-01\n2022-01-01');
    await expect(page.locator('#dates-output')).toContainText('2022-01-01');
  });

  test('Random Matrix Generator loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/random-matrix');
    await expect(page.locator('h1')).toContainText('Random Matrix Generator');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.locator('.grid.gap-3')).toBeVisible();
  });
});
