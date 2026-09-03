import { test, expect } from '@playwright/test';

test.describe('HTML Table to CSV / TSV Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/html-table-to-csv');
  });

  test('converts default HTML table into CSV format', async ({ page }) => {
    const inputArea = page.locator('#html-table-csv-input');
    const outputArea = page.locator('#html-table-csv-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('Product ID,Name,Category,Price,In Stock');
    expect(outputText).toContain('PROD-001,Wireless Mouse,Electronics,$29.99,Yes');
  });

  test('changes output delimiter to semicolon', async ({ page }) => {
    const delimiterSelect = page.locator('#html-table-csv-delimiter');
    await delimiterSelect.selectOption(';');

    const outputArea = page.locator('#html-table-csv-output');
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('Product ID;Name;Category;Price;In Stock');
    expect(outputText).toContain('PROD-001;Wireless Mouse;Electronics;$29.99;Yes');
  });

  test('loads quick presets', async ({ page }) => {
    const userPresetBtn = page.getByRole('button', { name: 'User Directory Profile (Spanned)' });
    await userPresetBtn.click();

    const outputArea = page.locator('#html-table-csv-output');
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('User Profile');
    expect(outputText).toContain('Alice,Vance,Lead Engineer,Active');
  });

  test('clears input with clear button', async ({ page }) => {
    const inputArea = page.locator('#html-table-csv-input');
    const clearBtn = page.getByRole('button', { name: 'Clear' }).first();

    await clearBtn.click();
    await expect(inputArea).toHaveValue('');
    await expect(page.locator('#html-table-csv-output')).toHaveValue('');
  });
});

test.describe('HTML Table to Markdown Table Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/html-table-to-markdown');
  });

  test('converts default HTML table into Markdown table markup with inline formatting', async ({ page }) => {
    const inputArea = page.locator('#html-md-input');
    const outputArea = page.locator('#html-md-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('Product ID');
    expect(outputText).toContain('Wireless Mouse');
    expect(outputText).toContain('[In Stock](https://example.com/stock)');
  });

  test('applies center alignment and compact mode', async ({ page }) => {
    const centerAlignBtn = page.getByTitle('Center Align');
    await centerAlignBtn.click();

    const compactCheckbox = page.locator('#html-md-compact');
    await compactCheckbox.check();

    const outputArea = page.locator('#html-md-output');
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('|:-:|:-:|:-:|:-:|:-:|');
    expect(outputText).toContain('|PROD-101|**Wireless Mouse**|Electronics|$29.99|[In Stock](https://example.com/stock)|');
  });

  test('loads system status matrix preset', async ({ page }) => {
    const statusPresetBtn = page.getByRole('button', { name: 'System Status Matrix' });
    await statusPresetBtn.click();

    const outputArea = page.locator('#html-md-output');
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('Service');
    expect(outputText).toContain('Environment');
    expect(outputText).toContain('Auth Service');
    expect(outputText).toContain('`24ms`');
  });

  test('clears input with clear button', async ({ page }) => {
    const inputArea = page.locator('#html-md-input');
    const clearBtn = page.getByRole('button', { name: 'Clear' }).first();

    await clearBtn.click();
    await expect(inputArea).toHaveValue('');
    await expect(page.locator('#html-md-output')).toHaveValue('');
  });
});
