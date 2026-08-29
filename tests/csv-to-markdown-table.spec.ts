import { test, expect } from '@playwright/test';

test.describe('CSV to Markdown Table Converter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-to-markdown-table');
  });

  test('should render properly with default state and presets', async ({ page }) => {
    // Check main title / headings
    await expect(page.locator('h1')).toContainText('CSV / TSV to Markdown Table');

    // Check textarea elements
    const inputArea = page.locator('#csv-md-input');
    const outputArea = page.locator('#csv-md-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Default input should contain Product,Category
    await expect(inputArea).toHaveValue(/Product,Category,Price/);

    // Default output should contain padded Markdown table lines
    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('Product');
    expect(outputVal).toContain('Category');
    expect(outputVal).toContain(':---------');
  });

  test('should update output reactively when editing CSV input', async ({ page }) => {
    const inputArea = page.locator('#csv-md-input');
    const outputArea = page.locator('#csv-md-output');

    await inputArea.fill('Name,Age,Role\nAlice,30,Developer\nBob,25,Designer');

    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('Name');
    expect(outputVal).toContain('Alice');
    expect(outputVal).toContain('Developer');
    expect(outputVal).toContain('Bob');
    expect(outputVal).toContain('Designer');
  });

  test('should handle column alignment and compact modes', async ({ page }) => {
    const inputArea = page.locator('#csv-md-input');
    const outputArea = page.locator('#csv-md-output');

    await inputArea.fill('A,B\n1,2');

    // Toggle compact mode
    const compactCheckbox = page.locator('#csv-md-compact');
    await compactCheckbox.check();

    let outputVal = await outputArea.inputValue();
    expect(outputVal).toBe('|A|B|\n|:--|:--|\n|1|2|');

    // Toggle center alignment
    const centerAlignBtn = page.getByTitle('Center Align');
    await centerAlignBtn.click();

    outputVal = await outputArea.inputValue();
    expect(outputVal).toBe('|A|B|\n|:-:|:-:|\n|1|2|');
  });

  test('should clear input on Escape and load preset', async ({ page }) => {
    const inputArea = page.locator('#csv-md-input');
    const outputArea = page.locator('#csv-md-output');

    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');

    // Load preset
    await page.getByRole('button', { name: 'Product Catalog' }).click();
    await expect(inputArea).not.toHaveValue('');
  });
});
