import { test, expect } from '@playwright/test';

test.describe('Visual SQL Query Builder Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-query-builder');
    await page.waitForLoadState('networkidle');
  });

  test('should render properly and generate default SQL query', async ({ page }) => {
    // Heading / Title check
    await expect(page.locator('h1')).toContainText('Générateur de Requête SQL');

    // Default primary table
    const tableInput = page.locator('#main-table-input');
    await expect(tableInput).toHaveValue('orders');

    // Default generated SQL output
    const outputTextarea = page.locator('#sql-query-output');
    const sqlText = await outputTextarea.inputValue();

    expect(sqlText).toContain('SELECT');
    expect(sqlText).toContain('FROM "orders"');
    expect(sqlText).toContain('INNER JOIN "users"');
    expect(sqlText).toContain('WHERE "orders"."status" = \'completed\'');
    expect(sqlText).toContain('ORDER BY "orders"."id" DESC');
    expect(sqlText).toContain('LIMIT 50');
  });

  test('should load interactive presets correctly', async ({ page }) => {
    // Click Blog Preset
    await page.getByRole('button', { name: 'Articles de Blog & Commentaires' }).click();

    const outputTextarea = page.locator('#sql-query-output');
    const sqlText = await outputTextarea.inputValue();

    expect(sqlText).toContain('FROM `posts`');
    expect(sqlText).toContain('LEFT JOIN `authors`');
    expect(sqlText).toContain('LEFT JOIN `comments`');
    expect(sqlText).toContain('LIMIT 20');
  });

  test('should update query when switching SQL dialects', async ({ page }) => {
    const dialectSelect = page.locator('#sql-dialect-select');
    await dialectSelect.selectOption('mysql');

    const outputTextarea = page.locator('#sql-query-output');
    const sqlText = await outputTextarea.inputValue();

    // MySQL uses backticks `orders` instead of double quotes "orders"
    expect(sqlText).toContain('FROM `orders`');
    expect(sqlText).toContain('INNER JOIN `users`');
  });

  test('should handle keyboard shortcuts for copy and reset', async ({ page }) => {
    // Unfocus editables by clicking on title
    await page.locator('h1').click();

    // Press C to copy
    await page.keyboard.press('c');
    await expect(page.getByText('Copié').first()).toBeVisible();

    // Press Escape to reset
    await page.keyboard.press('Escape');
    await expect(page.getByText('Générateur de requêtes réinitialisé !')).toBeVisible();

    // Verify main table input is focused
    await expect(page.locator('#main-table-input')).toBeFocused();
  });
});
