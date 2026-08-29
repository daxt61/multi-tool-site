import { test, expect } from '@playwright/test';

test.describe('CSV to HTML Table Converter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-to-html-table');
  });

  test('should render properly with default state and presets', async ({ page }) => {
    // Check main title / headings
    await expect(page.locator('h1')).toContainText('CSV / TSV to HTML Table');

    // Check textarea elements
    const inputArea = page.locator('#csv-html-input');
    const outputArea = page.locator('#csv-html-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Default output should contain HTML table tags
    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('<table class="table table-bordered table-striped table-hover">');
    expect(outputVal).toContain('<th>SKU</th>');
    expect(outputVal).toContain('<td>Wireless Mouse</td>');
  });

  test('should update output reactively and support minified HTML mode', async ({ page }) => {
    const inputArea = page.locator('#csv-html-input');
    const outputArea = page.locator('#csv-html-output');

    await inputArea.fill('City,Country\nParis,France\nTokyo,Japan');

    // Change format mode to minified
    const formatSelect = page.locator('#csv-html-format');
    await formatSelect.selectOption('minified');

    const outputVal = await outputArea.inputValue();
    expect(outputVal).toBe(
      '<table class="table table-bordered table-striped table-hover"><thead><tr><th>City</th><th>Country</th></tr></thead><tbody><tr><td>Paris</td><td>France</td></tr><tr><td>Tokyo</td><td>Japan</td></tr></tbody></table>'
    );
  });

  test('should customize table classes and checkboxes', async ({ page }) => {
    const customClassInput = page.locator('#csv-html-custom-class');
    const outputArea = page.locator('#csv-html-output');

    await customClassInput.fill('custom-grid');

    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('<table class="custom-grid table-bordered table-striped table-hover">');
  });
});
