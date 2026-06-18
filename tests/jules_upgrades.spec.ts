import { test, expect } from '@playwright/test';

test.describe('New and Upgraded Tools', () => {
  test('BPM Counter Pro features are visible', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/bpm-counter');
    await expect(page.getByText('Consistency', { exact: true })).toBeVisible();
    await expect(page.getByText('History', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Metronome' })).toBeVisible();
  });

  test('JSON to Excel tool loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-excel');
    await expect(page.getByText('JSON Input')).toBeVisible();
    await expect(page.getByText('Table Preview')).toBeVisible();
  });

  test('CSS Shadow Palette loads', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/css-shadow-palette');
    await expect(page.getByText('Soft Elevation')).toBeVisible();
    await expect(page.getByText('Color Configuration')).toBeVisible();
  });
});
