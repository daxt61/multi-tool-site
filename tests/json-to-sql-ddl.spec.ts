import { test, expect } from '@playwright/test';

test.describe('JSONToSQLDDL Converter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-sql-ddl');
  });

  test('successfully converts single object to PostgreSQL standard DDL', async ({ page }) => {
    const input = page.locator('#json-ddl-input');
    await input.fill(JSON.stringify({ id: 1, name: 'John Doe', is_active: true, rating: 4.8 }));

    const output = page.locator('pre');
    await expect(output).toContainText('CREATE TABLE my_table');
    await expect(output).toContainText('id INTEGER');
    await expect(output).toContainText('name VARCHAR(255)');
    await expect(output).toContainText('is_active BOOLEAN');
    await expect(output).toContainText('rating DECIMAL');
  });

  test('allows changing table name and dialect dynamically', async ({ page }) => {
    const tableNameInput = page.locator('#sql-tableName');
    await tableNameInput.fill('custom_orders');

    const dialectSelect = page.locator('#sql-dialect');
    await dialectSelect.selectOption('sqlite');

    const input = page.locator('#json-ddl-input');
    await input.fill(JSON.stringify({ is_shipped: true }));

    const output = page.locator('pre');
    await expect(output).toContainText('CREATE TABLE custom_orders');
    // SQLite boolean gets inferred as INTEGER
    await expect(output).toContainText('is_shipped INTEGER');
  });

  test('prevents prototype pollution and dangerous keys', async ({ page }) => {
    const input = page.locator('#json-ddl-input');
    await input.fill(JSON.stringify({ 'constructor': 'dangerous', 'normal': 12 }));

    const output = page.locator('pre');
    await expect(output).toContainText('_constructor');
    await expect(output).toContainText('normal INTEGER');
  });

  test('supports Esc keyboard shortcut to clear inputs and restore focus', async ({ page }) => {
    const input = page.locator('#json-ddl-input');
    await input.fill('{"test": 1}');
    await input.focus();

    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });
});
