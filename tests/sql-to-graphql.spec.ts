import { test, expect } from '@playwright/test';

test.describe('SQL to GraphQL Schema Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-graphql');
  });

  test('should render properly and convert SQL DDL to GraphQL SDL schema', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL to GraphQL');

    const sqlInput = page.locator('#sql-graphql-input');
    await sqlInput.fill(`CREATE TABLE users (
      id INT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(255) UNIQUE,
      created_at TIMESTAMP NOT NULL
    );`);

    const gqlOutput = page.locator('#graphql-schema-output');
    await expect(gqlOutput).toContainText('type Users {');
    await expect(gqlOutput).toContainText('id: ID!');
    await expect(gqlOutput).toContainText('username: String!');
    await expect(gqlOutput).toContainText('email: String');
    await expect(gqlOutput).toContainText('created_at: DateTime!');
  });

  test('should support toggling input types and query/mutation generation', async ({ page }) => {
    const sqlInput = page.locator('#sql-graphql-input');
    await sqlInput.fill(`CREATE TABLE products (
      id INT PRIMARY KEY,
      title VARCHAR(100) NOT NULL
    );`);

    const gqlOutput = page.locator('#graphql-schema-output');
    await expect(gqlOutput).toContainText('input CreateProductsInput {');
    await expect(gqlOutput).toContainText('type Query {');
    await expect(gqlOutput).toContainText('type Mutation {');

    // Uncheck input types
    const includeInputs = page.locator('#include-inputs');
    await includeInputs.uncheck();
    await expect(gqlOutput).not.toContainText('input CreateProductsInput {');

    // Uncheck query/mutation
    const includeQueryMutation = page.locator('#include-query-mutation');
    await includeQueryMutation.uncheck();
    await expect(gqlOutput).not.toContainText('type Query {');
    await expect(gqlOutput).not.toContainText('type Mutation {');
  });

  test('should load clickable presets', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: /E-Commerce/i });
    await ecommercePreset.click();

    const gqlOutput = page.locator('#graphql-schema-output');
    await expect(gqlOutput).toContainText('type Categories {');
    await expect(gqlOutput).toContainText('type Products {');
  });

  test('should handle keyboard shortcuts (Esc to clear)', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: /E-Commerce/i });
    await ecommercePreset.click();

    const gqlOutput = page.locator('#graphql-schema-output');
    await expect(gqlOutput).not.toHaveValue('');

    const sqlInput = page.locator('#sql-graphql-input');
    await sqlInput.blur();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(sqlInput).toHaveValue('');
    await expect(gqlOutput).toHaveValue('');
    await expect(sqlInput).toBeFocused();
  });
});
