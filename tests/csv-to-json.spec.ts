import { test, expect } from '@playwright/test';

test.describe('CSV / TSV to JSON Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-to-json');
    await page.waitForLoadState('networkidle');
  });

  test('renders tool title and default user directory preset', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('CSV / TSV to JSON');
    const inputVal = await page.locator('#csv-json-input').inputValue();
    expect(inputVal).toContain('first_name');
    expect(inputVal).toContain('alice@example.com');

    const outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('"email": "alice@example.com"');
    expect(outputVal).toContain('"age": 28');
  });

  test('switches output modes (2D Array, Keyed Map, NDJSON)', async ({ page }) => {
    // Select 2D Array
    await page.selectOption('#csv-json-mode', 'array_2d');
    let outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('"first_name"');
    expect(outputVal).toContain('"alice@example.com"');
    expect(outputVal).toContain('28');

    // Select Keyed Map
    await page.selectOption('#csv-json-mode', 'keyed_map');
    outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('"101": {');
    expect(outputVal).toContain('"102": {');

    // Select NDJSON
    await page.selectOption('#csv-json-mode', 'ndjson');
    outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('{"id":101,"first_name":"Alice"');
    expect(outputVal).toContain('{"id":102,"first_name":"Bob"');
  });

  test('transforms header casing', async ({ page }) => {
    await page.selectOption('#csv-json-casing', 'camelCase');
    let outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('"firstName": "Alice"');

    await page.selectOption('#csv-json-casing', 'CONSTANT_CASE');
    outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('"FIRST_NAME": "Alice"');
  });

  test('loads quick presets (Product Catalog, Financial Transactions)', async ({ page }) => {
    // Click Product Catalog preset
    await page.click('button:has-text("Product Catalog")');
    let inputVal = await page.locator('#csv-json-input').inputValue();
    expect(inputVal).toContain('PRD-001');

    let outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('"product_name": "Wireless Ergonomic Mouse"');
    expect(outputVal).toContain('"price": 49.99');

    // Click Financial Transactions preset
    await page.click('button:has-text("Financial Transactions")');
    inputVal = await page.locator('#csv-json-input').inputValue();
    expect(inputVal).toContain('TX-9001');

    outputVal = await page.locator('#json-output').inputValue();
    expect(outputVal).toContain('"amount": -150');
  });

  test('handles keyboard shortcuts (Esc clear and C copy)', async ({ page }) => {
    // Press Escape to clear
    await page.keyboard.press('Escape');
    const inputVal = await page.locator('#csv-json-input').inputValue();
    expect(inputVal).toBe('');

    // Load preset again and copy with 'C'
    await page.click('button:has-text("Product Catalog")');
    await page.keyboard.press('c');
    await page.waitForTimeout(200);
  });
});
