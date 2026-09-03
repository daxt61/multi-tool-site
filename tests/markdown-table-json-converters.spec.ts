import { test, expect } from '@playwright/test';

test.describe('Markdown Table to JSON Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/markdown-table-to-json');
  });

  test('converts default Markdown table into JSON array of objects with camelCase keys', async ({ page }) => {
    const inputArea = page.locator('#md-json-input');
    const outputArea = page.locator('#md-json-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    const json = JSON.parse(outputText);

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(4);
    expect(json[0]).toEqual({
      sKU: 'ELE-101',
      productName: 'Wireless Mouse',
      category: 'Electronics',
      price: 29.99,
      inStock: true,
    });
  });

  test('changes key formatting to snake_case', async ({ page }) => {
    const keyFormatSelect = page.locator('#md-json-key-format');
    await keyFormatSelect.selectOption('snake');

    const outputArea = page.locator('#md-json-output');
    const outputText = await outputArea.inputValue();
    const json = JSON.parse(outputText);

    expect(json[0]).toHaveProperty('sku');
    expect(json[0]).toHaveProperty('product_name');
    expect(json[0]).toHaveProperty('in_stock');
    expect(json[0].product_name).toBe('Wireless Mouse');
  });

  test('changes output mode to 2D Array and Key-Value Map', async ({ page }) => {
    const modeSelect = page.locator('#md-json-output-mode');

    // 2D Array mode
    await modeSelect.selectOption('2d');
    let outputText = await page.locator('#md-json-output').inputValue();
    let json = JSON.parse(outputText);
    expect(Array.isArray(json)).toBe(true);
    expect(json[0]).toEqual(['sKU', 'productName', 'category', 'price', 'inStock']);
    expect(json[1]).toEqual(['ELE-101', 'Wireless Mouse', 'Electronics', 29.99, true]);

    // Key-Value Map mode
    await modeSelect.selectOption('map');
    outputText = await page.locator('#md-json-output').inputValue();
    json = JSON.parse(outputText);
    expect(json).toHaveProperty('ELE-101');
    expect(json['ELE-101']).toEqual({
      productName: 'Wireless Mouse',
      category: 'Electronics',
      price: 29.99,
      inStock: true,
    });
  });

  test('loads quick presets', async ({ page }) => {
    const userPresetBtn = page.getByRole('button', { name: 'User Directory' });
    await userPresetBtn.click();

    const outputArea = page.locator('#md-json-output');
    const outputText = await outputArea.inputValue();
    const json = JSON.parse(outputText);

    expect(json[0]).toEqual({
      userID: 'USR-001',
      fullName: 'Alice Vance',
      role: 'Lead Engineer',
      department: 'Engineering',
      active: true,
    });
  });

  test('clears input with clear button', async ({ page }) => {
    const inputArea = page.locator('#md-json-input');
    const clearBtn = page.getByRole('button', { name: 'Clear' }).first();

    await clearBtn.click();
    await expect(inputArea).toHaveValue('');
    await expect(page.locator('#md-json-output')).toHaveValue('');
  });
});
