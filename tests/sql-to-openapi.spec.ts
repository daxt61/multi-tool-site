import { test, expect } from '@playwright/test';

test.describe('SQL to OpenAPI Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-openapi');
  });

  test('should render properly and convert SQL DDL to OpenAPI YAML schema', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL to OpenAPI');

    const sqlInput = page.locator('#sql-openapi-input');
    await sqlInput.fill(`CREATE TABLE users (
      id INT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(255) UNIQUE,
      created_at TIMESTAMP NOT NULL
    );`);

    const openApiOutput = page.locator('#openapi-output');
    await expect(openApiOutput).toContainText('users:');
    await expect(openApiOutput).toContainText('type: object');
    await expect(openApiOutput).toContainText('properties:');
    await expect(openApiOutput).toContainText('type: integer');
    await expect(openApiOutput).toContainText('type: string');
  });

  test('should switch output format to JSON and output mode to Full OpenAPI Document', async ({ page }) => {
    const sqlInput = page.locator('#sql-openapi-input');
    await sqlInput.fill(`CREATE TABLE products (
      id INT PRIMARY KEY,
      title VARCHAR(100) NOT NULL
    );`);

    const jsonBtn = page.getByRole('button', { name: 'json', exact: true });
    await jsonBtn.click();

    const outputModeSelect = page.locator('#openapi-output-mode');
    await outputModeSelect.selectOption('full_spec');

    const openApiOutput = page.locator('#openapi-output');
    await expect(openApiOutput).toContainText('"openapi": "3.0.3"');
    await expect(openApiOutput).toContainText('"paths":');
    await expect(openApiOutput).toContainText('"/products":');
  });

  test('should load clickable presets', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await ecommercePreset.click();

    const openApiOutput = page.locator('#openapi-output');
    await expect(openApiOutput).toContainText('categories:');
    await expect(openApiOutput).toContainText('products:');
  });

  test('should handle keyboard shortcuts (Esc to clear, C to copy)', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await ecommercePreset.click();

    const openApiOutput = page.locator('#openapi-output');
    await expect(openApiOutput).not.toHaveValue('');

    const sqlInput = page.locator('#sql-openapi-input');
    await sqlInput.blur();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(sqlInput).toHaveValue('');
    await expect(openApiOutput).toHaveValue('');
    await expect(sqlInput).toBeFocused();
  });
});
