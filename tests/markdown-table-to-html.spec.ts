import { test, expect } from '@playwright/test';

test.describe('Markdown Table to HTML Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/markdown-table-to-html');
  });

  test('renders page elements and default conversion correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tableau Markdown en HTML');

    const input = page.locator('#md-html-input');
    const output = page.locator('#html-table-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    const outputText = await output.inputValue();
    expect(outputText).toContain('<table class="table table-bordered table-striped table-hover">');
    expect(outputText).toContain('<thead>');
    expect(outputText).toContain('>SKU</th>');
    expect(outputText).toContain('<strong>Wireless Mouse</strong>');
  });

  test('switches presets correctly', async ({ page }) => {
    const output = page.locator('#html-table-output');

    // Click 'Employee Directory' preset
    await page.getByRole('button', { name: 'Employee Directory' }).click();
    let outputText = await output.inputValue();
    expect(outputText).toContain('Alice Vance');
    expect(outputText).toContain('<code>Active</code>');

    // Click 'Financial Summary' preset
    await page.getByRole('button', { name: 'Financial Summary' }).click();
    outputText = await output.inputValue();
    expect(outputText).toContain('Q1 2024');
    expect(outputText).toContain('<strong>29.1%</strong>');
  });

  test('toggles options (format mode, align mode, styles, inline parsing)', async ({ page }) => {
    const input = page.locator('#md-html-input');
    const output = page.locator('#html-table-output');

    await input.fill('| Name | Role |\n| :--- | ---: |\n| Alice | **Dev** |');

    // Toggle Minified format mode
    const formatSelect = page.locator('#md-html-format');
    await formatSelect.selectOption('minified');

    let outputText = await output.inputValue();
    expect(outputText).not.toContain('\n'); // Single line
    expect(outputText).toContain('<table class="table table-bordered table-striped table-hover"><thead><tr><th class="text-left">Name</th><th class="text-right">Role</th></tr></thead><tbody><tr><td class="text-left">Alice</td><td class="text-right"><strong>Dev</strong></td></tr></tbody></table>');

    // Switch to inline-style align mode
    const alignSelect = page.locator('#md-html-align-mode');
    await alignSelect.selectOption('inline-style');

    outputText = await output.inputValue();
    expect(outputText).toContain('style="text-align: left;"');
    expect(outputText).toContain('style="text-align: right;"');

    // Turn off inline markdown parsing
    const inlineCheckbox = page.getByLabel(/Parse Markdown/i);
    await inlineCheckbox.uncheck();

    outputText = await output.inputValue();
    expect(outputText).toContain('**Dev**');
    expect(outputText).not.toContain('<strong>Dev</strong>');
  });

  test('custom table class and style toggles work properly', async ({ page }) => {
    const output = page.locator('#html-table-output');
    const customClassInput = page.locator('#md-html-custom-class');

    await customClassInput.fill('custom-grid-table');

    let outputText = await output.inputValue();
    expect(outputText).toContain('<table class="custom-grid-table table-bordered table-striped table-hover">');

    // Toggle Compact mode (.table-sm)
    const compactCheckbox = page.getByLabel(/Compact \(\.table-sm\)/i);
    await compactCheckbox.check();

    outputText = await output.inputValue();
    expect(outputText).toContain('custom-grid-table table-bordered table-striped table-hover table-sm');
  });

  test('supports clear, copy, and keyboard shortcuts', async ({ page }) => {
    const input = page.locator('#md-html-input');
    const output = page.locator('#html-table-output');

    // Clear via Escape key when input is not focused
    await page.keyboard.press('Escape');

    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
    await expect(input).toBeFocused();

    // Fill new table and copy via C key when unfocused
    await input.fill('| Header |\n| --- |\n| Cell |');
    await page.locator('h1').click(); // Blur editable input

    await page.keyboard.press('c');
    // Expect toast notification
    await expect(page.locator('ol')).toContainText(/copied/i);
  });
});
