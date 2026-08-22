import { test, expect } from '@playwright/test';

test.describe('Sort CSV Rows Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-row-sorter');
    await page.waitForSelector('[data-testid="csv-sorter-container"]');
  });

  test('should render properly with labels and empty output initially', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Trier les Lignes CSV');

    const inputArea = page.locator('#csv-sort-input');
    const outputArea = page.locator('#csv-sort-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();
    await expect(outputArea).toHaveValue('');
  });

  test('should load preset and sort orders by total in descending order', async ({ page }) => {
    const inputArea = page.locator('#csv-sort-input');
    const outputArea = page.locator('#csv-sort-output');

    // Click "Trier Commandes par Prix" preset
    const presetBtn = page.getByRole('button', { name: 'Trier Commandes par Prix' });
    await presetBtn.click();

    await expect(inputArea).toHaveValue(/OrderID,Customer,Email,Category,Total,Status/);

    const outputVal = await outputArea.inputValue();
    const lines = outputVal.trim().split('\n');

    // Header + 5 data rows
    expect(lines.length).toBe(6);
    expect(lines[0]).toContain('OrderID,Customer,Email,Category,Total,Status');
    // Top price (499.00 - Diana)
    expect(lines[1]).toContain('1004,Diana Prince');
    // Lowest price (15.20 - Evan)
    expect(lines[5]).toContain('1005,Evan Wright');
  });

  test('should sort users alphabetically by name in ascending order', async ({ page }) => {
    const outputArea = page.locator('#csv-sort-output');

    // Click "Trier Utilisateurs par Nom" preset
    const presetBtn = page.getByRole('button', { name: 'Trier Utilisateurs par Nom' });
    await presetBtn.click();

    const outputVal = await outputArea.inputValue();
    const lines = outputVal.trim().split('\n');

    // Header: Name;Role;Department;Location
    // Names sorted A-Z: Alice, Bob, Marie, Pierre
    expect(lines[1]).toContain('Alice Smith');
    expect(lines[2]).toContain('Bob Jones');
    expect(lines[3]).toContain('Marie Curie');
    expect(lines[4]).toContain('Pierre Martin');
  });

  test('should sort emails by text length in ascending order', async ({ page }) => {
    const outputArea = page.locator('#csv-sort-output');

    // Click "Trier Emails par Longueur" preset
    const presetBtn = page.getByRole('button', { name: 'Trier Emails par Longueur' });
    await presetBtn.click();

    const outputVal = await outputArea.inputValue();
    const lines = outputVal.trim().split('\n');

    // Shortest email: d@x.io (David)
    expect(lines[1]).toContain('David,d@x.io');
    // Longest email: alice.smith.dev@enterprise.org (Alice)
    expect(lines[4]).toContain('Alice,alice.smith.dev@enterprise.org');
  });

  test('should clear inputs on Escape key', async ({ page }) => {
    const inputArea = page.locator('#csv-sort-input');
    const outputArea = page.locator('#csv-sort-output');

    // Load preset
    await page.getByRole('button', { name: 'Trier Commandes par Prix' }).click();
    await expect(inputArea).not.toHaveValue('');

    // Press Escape
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
