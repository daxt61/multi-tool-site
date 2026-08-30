import { test, expect } from '@playwright/test';

test.describe('CSV to ASCII Table Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-to-ascii');
  });

  test('renders properly and converts default preset to ASCII table', async ({ page }) => {
    const input = page.locator('#csv-ascii-input');
    const output = page.locator('#ascii-table-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    const value = await output.inputValue();
    expect(value).toContain('Name');
    expect(value).toContain('Role');
    expect(value).toContain('Department');
    expect(value).toContain('John Doe');
    expect(value).toContain('Developer');
  });

  test('switches presets correctly', async ({ page }) => {
    const output = page.locator('#ascii-table-output');

    // Click Product Catalog
    await page.click('button:has-text("Product Catalog")');
    let value = await output.inputValue();
    expect(value).toContain('Laptop Stand');

    // Click Server Inventory
    await page.click('button:has-text("Server Inventory")');
    value = await output.inputValue();
    expect(value).toContain('web-srv-01');
    expect(value).toContain('192.168.1.10');
  });

  test('switches table styles (Unicode, Basic, Markdown)', async ({ page }) => {
    const output = page.locator('#ascii-table-output');

    // Unicode style
    await page.click('button:has-text("Unicode")');
    let value = await output.inputValue();
    expect(value).toContain('┌');
    expect(value).toContain('│');
    expect(value).toContain('└');

    // Markdown style
    await page.click('button:has-text("Markdown")');
    value = await output.inputValue();
    expect(value).toContain('| Name | Role | Department | City |');
    expect(value).toContain('-----------');
  });

  test('handles Escape shortcut to clear and focus input', async ({ page }) => {
    const input = page.locator('#csv-ascii-input');
    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });
});
