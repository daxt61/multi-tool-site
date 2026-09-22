import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Drizzle ORM Schema Generator', () => {
  test('converts SQL CREATE TABLE into Drizzle ORM PostgreSQL schema', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-drizzle');
    await expect(page.locator('h1')).toContainText('SQL DDL en Drizzle');

    const inputArea = page.locator('#sql-drizzle-input');
    const outputArea = page.locator('#drizzle-output');

    await inputArea.fill(`CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  age INT
);`);

    await expect(outputArea).toContainText("import { integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';");
    await expect(outputArea).toContainText("export const users = pgTable('users', {");
    await expect(outputArea).toContainText("userId: uuid('user_id').primaryKey(),");
    await expect(outputArea).toContainText("email: varchar('email', { length: 255 }).notNull(),");
    await expect(outputArea).toContainText("age: integer('age'),");
  });

  test('supports dialect switching, presets, options, and keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-drizzle');

    const inputArea = page.locator('#sql-drizzle-input');
    const outputArea = page.locator('#drizzle-output');

    // Load preset
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();
    await expect(inputArea).toContainText('CREATE TABLE products');
    await expect(outputArea).toContainText("export const products = pgTable('products', {");

    // Switch dialect to MySQL
    await page.locator('#drizzle-dialect').selectOption('mysql');
    await expect(outputArea).toContainText("import { boolean, datetime, decimal, int, json, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';");
    await expect(outputArea).toContainText("export const products = mysqlTable('products', {");

    // Switch dialect to SQLite
    await page.locator('#drizzle-dialect').selectOption('sqlite');
    await expect(outputArea).toContainText("import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';");
    await expect(outputArea).toContainText("export const products = sqliteTable('products', {");

    // Enable InferSelect / InferInsert types export
    await page.getByLabel('Exporter les Types InferSelect/Insert').check();
    await expect(outputArea).toContainText("import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';");
    await expect(outputArea).toContainText("export type Products = InferSelectModel<typeof products>;");
    await expect(outputArea).toContainText("export type NewProducts = InferInsertModel<typeof products>;");

    // Escape shortcut resets input and restores focus
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
