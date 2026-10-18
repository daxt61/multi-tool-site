import { test, expect } from '@playwright/test';

test.describe('GraphQL SDL to Drizzle ORM Schema Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-drizzle');
  });

  test('renders the component with form controls and default options', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('GraphQL to Drizzle ORM');
    await expect(page.locator('#drizzle-dialect')).toHaveValue('pg');
    await expect(page.locator('#drizzle-casing')).toHaveValue('camelCase');
    await expect(page.locator('#drizzle-id-type')).toHaveValue('serial');
    await expect(page.locator('#graphql-drizzle-input')).toBeVisible();
    await expect(page.locator('#drizzle-output')).toBeVisible();
  });

  test('loads quick presets and generates Drizzle ORM schema', async ({ page }) => {
    // Click E-Commerce Catalog preset
    await page.click('button:has-text("E-Commerce Catalog")');
    await expect(page.locator('button:has-text("E-Commerce Catalog")')).toHaveAttribute('aria-pressed', 'true');

    const inputVal = await page.locator('#graphql-drizzle-input').inputValue();
    expect(inputVal).toContain('type Category');
    expect(inputVal).toContain('type Product');

    const outputVal = await page.locator('#drizzle-output').inputValue();
    expect(outputVal).toContain("import { boolean, pgEnum, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';");
    expect(outputVal).toContain("export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);");
    expect(outputVal).toContain("export const category = pgTable('category', {");
    expect(outputVal).toContain("id: serial('id').primaryKey()");
    expect(outputVal).toContain("export const product = pgTable('product', {");
    expect(outputVal).toContain("title: text('title').notNull()");
    expect(outputVal).toContain("price: real('price').notNull()");
  });

  test('converts to MySQL dialect correctly', async ({ page }) => {
    await page.click('button:has-text("E-Commerce Catalog")');
    await page.selectOption('#drizzle-dialect', 'mysql');

    const outputVal = await page.locator('#drizzle-output').inputValue();
    expect(outputVal).toContain("from 'drizzle-orm/mysql-core';");
    expect(outputVal).toContain("export const category = mysqlTable('category', {");
    expect(outputVal).toContain("id: int('id').autoincrement().primaryKey()");
  });

  test('converts to SQLite dialect correctly', async ({ page }) => {
    await page.click('button:has-text("E-Commerce Catalog")');
    await page.selectOption('#drizzle-dialect', 'sqlite');

    const outputVal = await page.locator('#drizzle-output').inputValue();
    expect(outputVal).toContain("import { boolean, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';");
    expect(outputVal).toContain("export const category = sqliteTable('category', {");
    expect(outputVal).toContain("id: integer('id').primaryKey({ autoIncrement: true })");
  });

  test('handles keyboard shortcuts Esc reset and focus restoration', async ({ page }) => {
    await page.click('button:has-text("User Management & Auth")');
    await expect(page.locator('#drizzle-output')).not.toHaveValue('');

    // Focus container and press Escape
    await page.locator('#graphql-drizzle-input').focus();
    await page.keyboard.press('Escape');

    await expect(page.locator('#graphql-drizzle-input')).toHaveValue('');
    await expect(page.locator('#drizzle-output')).toHaveValue('');
    await expect(page.locator('#graphql-drizzle-input')).toBeFocused();
  });

  test('escapes backslashes, single quotes, and special characters safely', async ({ page }) => {
    const maliciousGql = `
type BadType {
  id: ID!
  badfield: String!
}
enum HackEnum {
  VAL1
  VAL2
}
`;
    await page.locator('#graphql-drizzle-input').fill(maliciousGql);
    const outputVal = await page.locator('#drizzle-output').inputValue();

    expect(outputVal).toContain("export const hackEnumEnum = pgEnum('hack_enum', ['VAL1', 'VAL2']);");
    expect(outputVal).toContain("export const badType = pgTable('bad_type',");
  });
});
