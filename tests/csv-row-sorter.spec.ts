import { test, expect } from '@playwright/test';

test.describe('CSV Row Sorter Tool E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-row-sorter');
    await page.waitForSelector('[data-testid="csv-row-sorter-container"]');
  });

  test('should render the CSV row sorter tool layout correctly', async ({ page }) => {
    await expect(page.locator('#csv-sort-input')).toBeVisible();
    await expect(page.locator('#csv-sort-output')).toBeVisible();
    await expect(page.locator('#target-column-index')).toBeVisible();
    await expect(page.locator('#sort-mode')).toBeVisible();
    await expect(page.locator('#sort-direction')).toBeVisible();
  });

  test('should sort numeric values correctly when entering custom CSV', async ({ page }) => {
    const csvData = `ID,Product,Price\n1,Widget A,49.99\n2,Widget B,9.99\n3,Widget C,199.00\n4,Widget D,15.50`;

    await page.locator('#csv-sort-input').fill(csvData);

    // Select Column 3 (Price - index 2)
    await page.locator('#target-column-index').selectOption('2');

    // Select Numeric mode
    await page.locator('#sort-mode').selectOption('number');

    // Ensure Ascending direction is selected
    await page.locator('#sort-direction').click();

    // Check output: 9.99 < 15.50 < 49.99 < 199.00
    const outputValue = await page.locator('#csv-sort-output').inputValue();
    expect(outputValue).toContain('Widget B,9.99');
    expect(outputValue.indexOf('Widget B,9.99')).toBeLessThan(outputValue.indexOf('Widget D,15.50'));
    expect(outputValue.indexOf('Widget D,15.50')).toBeLessThan(outputValue.indexOf('Widget A,49.99'));
    expect(outputValue.indexOf('Widget A,49.99')).toBeLessThan(outputValue.indexOf('Widget C,199.00'));
  });

  test('should sort in descending direction when toggled', async ({ page }) => {
    const csvData = `ID,Product,Price\n1,Widget A,49.99\n2,Widget B,9.99\n3,Widget C,199.00\n4,Widget D,15.50`;

    await page.locator('#csv-sort-input').fill(csvData);
    await page.locator('#target-column-index').selectOption('2');
    await page.locator('#sort-mode').selectOption('number');

    // Click Descending
    await page.getByRole('button', { name: /Descending/i }).click();

    const outputValue = await page.locator('#csv-sort-output').inputValue();
    // 199.00 > 49.99 > 15.50 > 9.99
    expect(outputValue.indexOf('Widget C,199.00')).toBeLessThan(outputValue.indexOf('Widget A,49.99'));
    expect(outputValue.indexOf('Widget A,49.99')).toBeLessThan(outputValue.indexOf('Widget D,15.50'));
    expect(outputValue.indexOf('Widget D,15.50')).toBeLessThan(outputValue.indexOf('Widget B,9.99'));
  });

  test('should load quick presets correctly', async ({ page }) => {
    // Click "Sort Users by Name" preset
    await page.getByRole('button', { name: 'Sort Users by Name' }).click();

    const inputValue = await page.locator('#csv-sort-input').inputValue();
    expect(inputValue).toContain('Jean Dupont;Software Engineer;Engineering');

    const outputValue = await page.locator('#csv-sort-output').inputValue();
    // Alice Smith < Jean Dupont < Marie Curie < Pierre Martin
    expect(outputValue.indexOf('Alice Smith')).toBeLessThan(outputValue.indexOf('Jean Dupont'));
    expect(outputValue.indexOf('Jean Dupont')).toBeLessThan(outputValue.indexOf('Marie Curie'));
    expect(outputValue.indexOf('Marie Curie')).toBeLessThan(outputValue.indexOf('Pierre Martin'));
  });

  test('should clear input when clicking Clear button or pressing Escape key', async ({ page }) => {
    await page.locator('#csv-sort-input').fill('A,B\n2,1\n1,2');
    expect(await page.locator('#csv-sort-input').inputValue()).not.toBe('');

    // Press Escape
    await page.keyboard.press('Escape');
    expect(await page.locator('#csv-sort-input').inputValue()).toBe('');
  });

  test('should copy output when pressing C key when input is unfocused', async ({ page }) => {
    await page.locator('#csv-sort-input').fill('Col\nB\nA\nC');
    await page.locator('#csv-sort-input').blur();

    await page.keyboard.press('c');

    // Verify toast or output content
    await expect(page.getByText('Sorted CSV copied to clipboard!')).toBeVisible();
  });
});
