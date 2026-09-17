import { test, expect } from '@playwright/test';

test.describe('SQL DDL to TypeBox Schema Generator', () => {
  test('converts SQL CREATE TABLE into TypeBox schemas', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-typebox');
    await expect(page.locator('h1')).toContainText('SQL DDL en TypeBox');

    const inputArea = page.locator('#sql-typebox-input');
    const outputArea = page.locator('#typebox-output');

    await inputArea.fill(`CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  age INT
);`);

    await expect(outputArea).toContainText("export const UsersSchema = Type.Object({");
    await expect(outputArea).toContainText('userId: Type.String({ format: "uuid" }),');
    await expect(outputArea).toContainText('email: Type.String({ format: "email" }),');
    await expect(outputArea).toContainText('age: Type.Optional(Type.Integer()),');
    await expect(outputArea).toContainText('export type Users = Static<typeof UsersSchema>;');
  });

  test('applies presets, options, and handles shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-typebox');

    const inputArea = page.locator('#sql-typebox-input');
    const outputArea = page.locator('#typebox-output');

    // Load preset
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();
    await expect(inputArea).toContainText('CREATE TABLE products');
    await expect(outputArea).toContainText('export const ProductsSchema = Type.Object({');

    // Change casing to snake_case
    await page.locator('#typebox-casing').selectOption('snake_case');
    await expect(outputArea).toContainText('is_active:');

    // Change nullability mode to union_null
    await page.locator('#typebox-nullability').selectOption('union_null');
    await expect(outputArea).toContainText('Type.Union([');

    // Escape shortcut test
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
