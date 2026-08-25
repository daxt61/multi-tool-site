import { test, expect } from '@playwright/test';

test.describe('CSV Column Renamer Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-column-renamer');
    await page.waitForSelector('[data-testid="csv-renamer-container"]');
  });

  test('renders correctly with default UI components', async ({ page }) => {
    await expect(page.locator('#csv-renamer-input')).toBeVisible();
    await expect(page.locator('#csv-renamer-output')).toBeVisible();
    await expect(page.locator('#input-delimiter-select')).toBeVisible();
    await expect(page.locator('#output-delimiter-select')).toBeVisible();
  });

  test('renames column headers and transforms cell values', async ({ page }) => {
    const inputArea = page.locator('#csv-renamer-input');
    await inputArea.fill('id,user_name,price\n1,john_doe,99.99\n2,jane_smith,49.50');

    // Find the new name input for column 'user_name' (Row 2, second input cell)
    const nameInput = page.locator('table tbody tr').nth(1).locator('input[type="text"]').first();
    await nameInput.fill('full_name');

    // Change casing for second column (user_name)
    const casingSelect = page.locator('table tbody tr').nth(1).locator('select');
    await casingSelect.selectOption('uppercase');

    const outputArea = page.locator('#csv-renamer-output');
    await expect(outputArea).toHaveValue(/id,full_name,price\n1,JOHN_DOE,99.99\n2,JANE_SMITH,49.50/);
  });

  test('applies prefix, suffix and fallback default values', async ({ page }) => {
    const inputArea = page.locator('#csv-renamer-input');
    await inputArea.fill('id,amount,notes\n1,100,\n2,200,ok');

    // Set prefix on amount
    const amountPrefix = page.locator('table input[placeholder="e.g. US-"]').nth(1);
    await amountPrefix.fill('$');

    // Set fallback on notes
    const notesFallback = page.locator('table input[placeholder="e.g. N/A"]').nth(2);
    await notesFallback.fill('N/A');

    const outputArea = page.locator('#csv-renamer-output');
    await expect(outputArea).toHaveValue(/id,amount,notes\n1,\$100,N\/A\n2,\$200,ok/);
  });

  test('loads quick presets', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    const inputArea = page.locator('#csv-renamer-input');
    await expect(inputArea).toHaveValue(/sku,prod_name,unit_price/);
  });

  test('clears input and restores focus on Escape key', async ({ page }) => {
    const inputArea = page.locator('#csv-renamer-input');
    await inputArea.fill('a,b\n1,2');
    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
