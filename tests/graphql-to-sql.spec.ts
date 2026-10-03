import { test, expect } from '@playwright/test';

test.describe('GraphQL SDL to SQL DDL Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/outil/graphql-to-sql');
  });

  test('renders tool elements and converts sample GraphQL schema to PostgreSQL', async ({ page }) => {
    const inputArea = page.locator('#graphql-sql-input');
    const outputArea = page.locator('#sql-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const sampleGql = `
      enum Role {
        ADMIN
        USER
      }

      type User {
        id: ID!
        username: String!
        email: String
        role: Role!
      }
    `;

    await inputArea.fill(sampleGql);

    await expect(outputArea).toHaveValue(/CREATE TYPE "role" AS ENUM \('ADMIN', 'USER'\);/);
    await expect(outputArea).toHaveValue(/CREATE TABLE "user" \(/);
    await expect(outputArea).toHaveValue(/id BIGSERIAL PRIMARY KEY/);
    await expect(outputArea).toHaveValue(/username TEXT NOT NULL/);
    await expect(outputArea).toHaveValue(/email TEXT/);
    await expect(outputArea).toHaveValue(/"role" role NOT NULL/);
  });

  test('converts schema across different SQL dialects and option toggles', async ({ page }) => {
    const inputArea = page.locator('#graphql-sql-input');
    const outputArea = page.locator('#sql-output');

    const sampleGql = `
      type Product {
        id: ID!
        title: String!
        price: Float
        category: Category!
      }

      type Category {
        id: ID!
        name: String!
      }
    `;

    await inputArea.fill(sampleGql);

    // MySQL dialect
    await page.locator('#sql-dialect').selectOption('mysql');
    await expect(outputArea).toHaveValue(/id BIGINT AUTO_INCREMENT PRIMARY KEY/);
    await expect(outputArea).toHaveValue(/title VARCHAR\(255\) NOT NULL/);
    await expect(outputArea).toHaveValue(/price DOUBLE/);

    // Foreign Keys enabled
    await expect(outputArea).toHaveValue(/FOREIGN KEY \(category\) REFERENCES category\(id\) ON DELETE SET NULL/);

    // Change ID type to UUID
    await page.locator('#id-type').selectOption('uuid');
    await expect(outputArea).toHaveValue(/id VARCHAR\(36\) PRIMARY KEY/);

    // Quote Identifiers
    await page.getByLabel(/Identifiants entre Guillemets/i).check();
    await expect(outputArea).toHaveValue(/`product`/);
    await expect(outputArea).toHaveValue(/`id`/);
  });

  test('loads quick start presets', async ({ page }) => {
    const inputArea = page.locator('#graphql-sql-input');
    const outputArea = page.locator('#sql-output');

    // Click E-Commerce Catalog preset
    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();

    await expect(inputArea).toHaveValue(/type Product/);
    await expect(outputArea).toHaveValue(/CREATE TABLE product \(/);
    await expect(outputArea).toHaveValue(/CREATE TABLE category \(/);
  });

  test('handles clear button and restores focus', async ({ page }) => {
    const inputArea = page.locator('#graphql-sql-input');
    const outputArea = page.locator('#sql-output');

    await inputArea.fill('type Item { id: ID! }');
    await expect(outputArea).toHaveValue(/CREATE TABLE item/);

    await page.getByRole('button', { name: /Effacer/i }).click();

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('supports Escape shortcut to clear input', async ({ page }) => {
    const inputArea = page.locator('#graphql-sql-input');
    await inputArea.fill('type Post { id: ID! }');

    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
  });

  test('enforces MAX_LENGTH limit and displays error banner', async ({ page }) => {
    const inputArea = page.locator('#graphql-sql-input');

    // Fill with string exceeding MAX_LENGTH (100000 chars)
    const longString = 'a'.repeat(100001);
    await inputArea.fill(longString);

    await expect(page.locator('text=/trop longue|too long/i')).toBeVisible();
  });
});
