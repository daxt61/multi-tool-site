import { test, expect } from '@playwright/test';

test.describe('GraphQL & SQL to Ruby Converters E2E Tests', () => {
  test('GraphQLToRuby converts GraphQL SDL to Ruby models in all construct styles', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-ruby');

    // Heading visibility
    await expect(page.locator('h1')).toContainText('GraphQL to Ruby');

    // Click E-Commerce Catalog preset
    await page.getByRole('button', { name: 'E-Commerce Catalog' }).click();

    // Verify GraphQL input has content
    const inputArea = page.locator('#graphql-ruby-input');
    await expect(inputArea).toHaveValue(/type Category/);

    const outputArea = page.locator('#ruby-output');

    // 1. Standard Class
    await page.locator('#ruby-construct-style').selectOption('class');
    await expect(outputArea).toHaveValue(/class Category/);
    await expect(outputArea).toHaveValue(/attr_accessor :id, :name, :slug, :parent/);

    // 2. Data.define
    await page.locator('#ruby-construct-style').selectOption('data');
    await expect(outputArea).toHaveValue(/Category = Data\.define\(:id, :name, :slug, :parent\)/);

    // 3. Struct.new
    await page.locator('#ruby-construct-style').selectOption('struct');
    await expect(outputArea).toHaveValue(/Category = Struct\.new\(:id, :name, :slug, :parent, keyword_init: true\)/);

    // 4. Sorbet (T::Struct)
    await page.locator('#ruby-construct-style').selectOption('sorbet');
    await expect(outputArea).toHaveValue(/class Category < T::Struct/);
    await expect(outputArea).toHaveValue(/const :id, String/);

    // 5. Dry::Struct
    await page.locator('#ruby-construct-style').selectOption('dry_struct');
    await expect(outputArea).toHaveValue(/class Category < Dry::Struct/);
    await expect(outputArea).toHaveValue(/attribute :id, Types::String/);

    // Test Casing option
    await page.locator('#ruby-property-casing').selectOption('camelCase');
    await expect(outputArea).toHaveValue(/attribute :isActive/);

    // Test Clear
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });

  test('SQLToRuby converts SQL CREATE TABLE DDL to Ruby models in all construct styles', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-ruby');

    // Heading visibility
    await expect(page.locator('h1')).toContainText('SQL DDL to Ruby');

    // Click E-Commerce Catalog preset
    await page.getByRole('button', { name: 'E-Commerce Catalog' }).click();

    // Verify SQL input has content
    const inputArea = page.locator('#sql-ruby-input');
    await expect(inputArea).toHaveValue(/CREATE TABLE categories/);

    const outputArea = page.locator('#ruby-sql-output');

    // 1. Standard Class
    await page.locator('#sql-ruby-construct-style').selectOption('class');
    await expect(outputArea).toHaveValue(/class Category/);
    await expect(outputArea).toHaveValue(/attr_accessor :id, :name, :slug, :parent_id/);

    // 2. Data.define
    await page.locator('#sql-ruby-construct-style').selectOption('data');
    await expect(outputArea).toHaveValue(/Category = Data\.define\(:id, :name, :slug, :parent_id\)/);

    // 3. Struct.new
    await page.locator('#sql-ruby-construct-style').selectOption('struct');
    await expect(outputArea).toHaveValue(/Category = Struct\.new\(:id, :name, :slug, :parent_id, keyword_init: true\)/);

    // 4. Sorbet (T::Struct)
    await page.locator('#sql-ruby-construct-style').selectOption('sorbet');
    await expect(outputArea).toHaveValue(/class Category < T::Struct/);
    await expect(outputArea).toHaveValue(/const :id, Integer/);

    // 5. Dry::Struct
    await page.locator('#sql-ruby-construct-style').selectOption('dry_struct');
    await expect(outputArea).toHaveValue(/class Category < Dry::Struct/);
    await expect(outputArea).toHaveValue(/attribute :id, Types::Integer/);

    // Test Casing
    await page.locator('#sql-ruby-property-casing').selectOption('camelCase');
    await expect(outputArea).toHaveValue(/attribute\?? :parentId/);

    // Test Clear
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
