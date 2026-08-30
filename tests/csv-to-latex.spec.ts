import { test, expect } from '@playwright/test';

test.describe('CSV to LaTeX Table Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-to-latex');
  });

  test('renders properly and converts default preset to LaTeX tabular code', async ({ page }) => {
    const input = page.locator('#csv-latex-input');
    const output = page.locator('#csv-latex-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    const value = await output.inputValue();
    expect(value).toContain('\\begin{tabular}{l l l l}');
    expect(value).toContain('\\toprule');
    expect(value).toContain('\\textbf{Student}');
    expect(value).toContain('Alice & Mathematics & 95 & A+');
    expect(value).toContain('\\end{tabular}');
  });

  test('switches presets correctly', async ({ page }) => {
    const output = page.locator('#csv-latex-output');

    // Click Product Inventory preset
    await page.click('button:has-text("Product Inventory")');
    let value = await output.inputValue();
    expect(value).toContain('Wireless Ergonomic Mouse');

    // Click Financial Report preset
    await page.click('button:has-text("Financial Report")');
    value = await output.inputValue();
    expect(value).toContain('Q1 2024');
    expect(value).toContain('150000.00');
  });

  test('escapes special LaTeX characters in CSV cells', async ({ page }) => {
    const input = page.locator('#csv-latex-input');
    const output = page.locator('#csv-latex-output');

    await input.fill('Symbol,Usage\n&,Ampersand\n%,Percent\n$,Dollar\n#,Hash\n_,Underscore');

    const value = await output.inputValue();
    expect(value).toContain('\\& & Ampersand');
    expect(value).toContain('\\% & Percent');
    expect(value).toContain('\\$ & Dollar');
    expect(value).toContain('\\# & Hash');
    expect(value).toContain('\\_ & Underscore');
  });

  test('handles style switches and options toggles', async ({ page }) => {
    const output = page.locator('#csv-latex-output');

    // Switch to Standard style
    await page.click('text=Standard (\\hline)');
    let value = await output.inputValue();
    expect(value).toContain('\\hline');
    expect(value).not.toContain('\\toprule');

    // Toggle vertical gridlines
    await page.click('button:has-text("Vertical gridlines")');
    value = await output.inputValue();
    expect(value).toContain('\\begin{tabular}{|l|l|l|l|}');
  });

  test('handles Escape keyboard shortcut to clear input and focus', async ({ page }) => {
    const input = page.locator('#csv-latex-input');
    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });
});
