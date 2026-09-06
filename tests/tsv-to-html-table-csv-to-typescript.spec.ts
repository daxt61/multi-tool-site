import { test, expect } from '@playwright/test';

test.describe('TSV to HTML Table & CSV to TypeScript Tools E2E Tests', () => {
  test('TSV to HTML Table: converts default TSV data to HTML table markup', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/tsv-to-html-table');

    // Input and Output textareas should be present
    const inputArea = page.locator('#tsv-html-input');
    const outputArea = page.locator('#tsv-html-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('<table class="table table-bordered table-striped table-hover">');
    expect(outputText).toContain('<th>SKU</th>');
    expect(outputText).toContain('<td>Wireless Mouse</td>');
  });

  test('TSV to HTML Table: applies presets and minified format mode', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/tsv-to-html-table');

    // Click on User Directory preset
    await page.getByRole('button', { name: 'User Directory' }).click();

    const inputArea = page.locator('#tsv-html-input');
    await expect(inputArea).toHaveValue(/Alice Vance/);

    // Switch format mode to minified
    await page.locator('#tsv-html-format').selectOption('minified');

    const outputArea = page.locator('#tsv-html-output');
    const minifiedText = await outputArea.inputValue();

    expect(minifiedText).not.toContain('\n');
    expect(minifiedText).toContain('<th>ID</th><th>Full Name</th>');
  });

  test('TSV to HTML Table: clears input with Escape key', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/tsv-to-html-table');

    const inputArea = page.locator('#tsv-html-input');
    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    const outputArea = page.locator('#tsv-html-output');
    await expect(outputArea).toHaveValue('');
  });

  test('CSV to TypeScript: converts CSV data to TypeScript interface', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-to-typescript');

    const inputArea = page.locator('#csv-ts-input');
    const outputArea = page.locator('#ts-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('export interface Record {');
    expect(outputText).toContain('id: number;');
    expect(outputText).toContain('fullName: string;');
    expect(outputText).toContain('isActive: boolean;');
  });

  test('CSV to TypeScript: transforms type name, output mode, and optional fields', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-to-typescript');

    // Change type name
    const typeNameInput = page.locator('#csv-ts-type-name');
    await typeNameInput.fill('UserProfile');

    // Change output mode to type alias
    await page.locator('#csv-ts-output-mode').selectOption('type');

    // Toggle optional fields
    await page.locator('#csv-ts-optional').check();

    const outputArea = page.locator('#ts-output');
    const outputText = await outputArea.inputValue();

    expect(outputText).toContain('export type UserProfile = {');
    expect(outputText).toContain('id?: number;');
    expect(outputText).toContain('fullName?: string;');
  });

  test('CSV to TypeScript: loads presets and clears input with Escape key', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-to-typescript');

    // Load Product Inventory preset
    await page.getByRole('button', { name: 'Product Inventory TSV' }).click();

    const inputArea = page.locator('#csv-ts-input');
    await expect(inputArea).toHaveValue(/ELE-101/);

    // Clear input using Escape
    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    const outputArea = page.locator('#ts-output');
    await expect(outputArea).toHaveValue('');
  });
});
