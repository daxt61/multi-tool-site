import { test, expect } from '@playwright/test';

test.describe('Markdown Table to CSV / TSV Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/markdown-table-to-csv');
    await page.waitForLoadState('networkidle');
  });

  test('converts markdown table to CSV with default preset', async ({ page }) => {
    const mdInput = page.locator('#md-table-input');
    const csvOutput = page.locator('#csv-table-output');

    await expect(mdInput).not.toHaveValue('');
    await expect(csvOutput).toContainText('ID,Product Name,Category,Price,Stock');
    await expect(csvOutput).toContainText('101,"Wireless Headphones, Pro",Electronics,$89.99,In Stock');
  });

  test('loads presets and changes output delimiters', async ({ page }) => {
    const mdInput = page.locator('#md-table-input');
    const csvOutput = page.locator('#csv-table-output');

    // Click Financial Summary preset (which uses Tab / TSV)
    const financialPresetBtn = page.getByRole('button', { name: 'Synthèse Financière' });
    await financialPresetBtn.click();

    await expect(mdInput).toContainText('Month');
    await expect(csvOutput).toContainText('Month\tRevenue\tExpenses\tNet Profit');

    // Switch delimiter to Semicolon
    const delimSelect = page.locator('#output-delimiter');
    await delimSelect.selectOption(';');
    await expect(csvOutput).toContainText('Month;Revenue;Expenses;Net Profit');
  });

  test('clears inputs with Escape key and restores focus', async ({ page }) => {
    const mdInput = page.locator('#md-table-input');
    await mdInput.focus();
    await page.keyboard.press('Escape');

    await expect(mdInput).toHaveValue('');
    await expect(mdInput).toBeFocused();
  });
});
