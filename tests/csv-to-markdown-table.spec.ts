import { test, expect } from '@playwright/test';

test.describe('CSV to Markdown Table Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-to-markdown-table');
    await page.waitForSelector('[role="region"][aria-label="CSV to Markdown Table Converter"]');
  });

  test('should render empty state and load product catalog preset', async ({ page }) => {
    const input = page.locator('#csv-md-input');
    const output = page.locator('#csv-md-output');

    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');

    // Load Product Catalog preset
    const presetBtn = page.getByRole('button', { name: 'Product Catalog (CSV)' });
    await presetBtn.click();

    await expect(input).toContainText('PRD-001,Wireless Ergonomic Mouse,Electronics,49.99,150');
    await expect(output).toContainText('| SKU     | Product Name');
    await expect(output).toContainText('| PRD-001 | Wireless Ergonomic Mouse');
  });

  test('should update markdown output on alignment and formatting toggles', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'Financial Report (;)' });
    await presetBtn.click();

    const output = page.locator('#csv-md-output');

    // Financial preset sets alignment right by default
    await expect(output).toContainText('---:');

    // Change alignment to Center
    const alignSelect = page.locator('#align-select');
    await alignSelect.selectOption('center');
    await expect(output).toContainText(':-----:');

    // Toggle pretty padding off
    const prettyCheckbox = page.locator('#pretty-checkbox');
    await prettyCheckbox.uncheck();
    await expect(output).toContainText('| Quarter | Revenue ($) | Expenses ($) | Net Profit ($) | Growth (%) |');
    await expect(output).toContainText('| :---: | :---: | :---: | :---: | :---: |');

    // Clear with Escape key
    await page.keyboard.press('Escape');
    const input = page.locator('#csv-md-input');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });
});
