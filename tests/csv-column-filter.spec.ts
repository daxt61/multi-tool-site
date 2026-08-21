import { test, expect } from '@playwright/test';

test.describe('CSV Column & Row Filter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-column-filter');
    await page.waitForSelector('[data-testid="csv-filter-container"]');
  });

  test('should render properly with labels and empty output initially', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Filtre de Colonnes CSV');

    const inputArea = page.locator('#csv-filter-input');
    const outputArea = page.locator('#csv-filter-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();
    await expect(outputArea).toHaveValue('');
  });

  test('should load preset and filter completed orders correctly', async ({ page }) => {
    const inputArea = page.locator('#csv-filter-input');
    const outputArea = page.locator('#csv-filter-output');

    // Click "Commandes Terminées" preset
    const presetBtn = page.getByRole('button', { name: 'Commandes Terminées' });
    await presetBtn.click();

    // Input should be populated
    await expect(inputArea).toHaveValue(/OrderID,Customer,Email,Category,Total,Status/);

    // Filtered output should contain only "Completed" status rows
    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('1001,Alice Smith');
    expect(outputVal).toContain('1003,Charlie Brown');
    expect(outputVal).toContain('1005,Evan Wright');
    expect(outputVal).not.toContain('1002,Bob Jones'); // Pending
    expect(outputVal).not.toContain('1004,Diana Prince'); // Shipped
  });

  test('should support numeric filtering (greater than 100)', async ({ page }) => {
    const outputArea = page.locator('#csv-filter-output');

    // Click "Transactions Élevées" preset
    const presetBtn = page.getByRole('button', { name: 'Transactions Élevées' });
    await presetBtn.click();

    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('249.99'); // Alice (249.99 > 100)
    expect(outputVal).toContain('120.00'); // Charlie (120 > 100)
    expect(outputVal).toContain('499.00'); // Diana (499 > 100)
    expect(outputVal).not.toContain('89.50'); // Bob (89.50 <= 100)
    expect(outputVal).not.toContain('15.20'); // Evan (15.20 <= 100)
  });

  test('should support remove matching mode', async ({ page }) => {
    const outputArea = page.locator('#csv-filter-output');

    // Load Completed Orders preset
    await page.getByRole('button', { name: 'Commandes Terminées' }).click();

    // Switch action mode to "Supprimer les Correspondances"
    await page.getByRole('button', { name: 'Supprimer les Correspondances' }).click();

    const outputVal = await outputArea.inputValue();
    // Should now contain non-completed orders (Pending and Shipped)
    expect(outputVal).toContain('1002,Bob Jones');
    expect(outputVal).toContain('1004,Diana Prince');
    expect(outputVal).not.toContain('1001,Alice Smith');
  });

  test('should clear inputs on Escape key or Clear button press', async ({ page }) => {
    const inputArea = page.locator('#csv-filter-input');
    const outputArea = page.locator('#csv-filter-output');

    // Load a preset
    await page.getByRole('button', { name: 'Commandes Terminées' }).click();
    await expect(inputArea).not.toHaveValue('');

    // Press Escape
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
