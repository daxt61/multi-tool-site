import { test, expect } from '@playwright/test';

test.describe('TSV to Markdown Table Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/tsv-to-markdown-table');
  });

  test('converts default TSV data into a Markdown table', async ({ page }) => {
    const inputTextArea = page.locator('#tsv-md-input');
    const outputTextArea = page.locator('#tsv-md-output');

    await expect(inputTextArea).toBeVisible();
    await expect(outputTextArea).toBeVisible();

    const outputValue = await outputTextArea.inputValue();
    expect(outputValue).toContain('| SKU');
    expect(outputValue).toContain('| Wireless Mouse');
    expect(outputValue).toContain('| :---');
  });

  test('applies center alignment and compact mode', async ({ page }) => {
    const centerAlignBtn = page.locator('button[title="Center Align"]');
    await centerAlignBtn.click();

    const compactCheckbox = page.locator('#tsv-md-compact');
    await compactCheckbox.check();

    const outputTextArea = page.locator('#tsv-md-output');
    const outputValue = await outputTextArea.inputValue();

    expect(outputValue).toContain('|:-:|');
    expect(outputValue).toContain('|SKU|Product Name|Category|Price|Stock|');
  });

  test('loads quick presets', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'System Status' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    const inputTextArea = page.locator('#tsv-md-input');
    const inputValue = await inputTextArea.inputValue();

    expect(inputValue).toContain('Auth API');
    expect(inputValue).toContain('Payment Gateway');

    const outputTextArea = page.locator('#tsv-md-output');
    const outputValue = await outputTextArea.inputValue();
    expect(outputValue).toContain('Operational');
  });

  test('clears input with clear button and shortcut', async ({ page }) => {
    const clearBtn = page.getByRole('button', { name: 'Clear' }).first();
    await clearBtn.click();

    const inputTextArea = page.locator('#tsv-md-input');
    const outputTextArea = page.locator('#tsv-md-output');

    await expect(inputTextArea).toHaveValue('');
    await expect(outputTextArea).toHaveValue('');
  });
});
