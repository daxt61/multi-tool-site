import { test, expect } from '@playwright/test';

test.describe('SQL to Knex.js Migration Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/outil/sql-to-knex');
    await page.waitForLoadState('networkidle');
  });

  test('renders tool title and UI elements correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/SQL DDL en Knex.js/i);
    await expect(page.locator('label[for="sql-knex-input"]')).toBeVisible();
    await expect(page.locator('label[for="knex-output"]')).toBeVisible();
    await expect(page.locator('#sql-knex-input')).toBeVisible();
    await expect(page.locator('#knex-output')).toBeVisible();
  });

  test('converts SQL DDL into TypeScript Knex.js migration by default', async ({ page }) => {
    const sampleSql = `
      CREATE TABLE users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await page.fill('#sql-knex-input', sampleSql);

    const output = page.locator('#knex-output');
    await expect(output).toHaveValue(/import { Knex } from 'knex';/);
    await expect(output).toHaveValue(/export async function up\(knex: Knex\): Promise<void>/);
    await expect(output).toHaveValue(/table\.increments\('user_id'\)\.primary\(\)/);
    await expect(output).toHaveValue(/table\.string\('username', 50\)\.unique\(\)\.notNullable\(\);/);
    await expect(output).toHaveValue(/table\.boolean\('is_active'\)\.nullable\(\)\.defaultTo\(true\);/);
    await expect(output).toHaveValue(/table\.timestamps\(true, true\);/);
    await expect(output).toHaveValue(/export async function down\(knex: Knex\): Promise<void>/);
    await expect(output).toHaveValue(/\.dropTableIfExists\('users'\)/);
  });

  test('supports JavaScript export syntax mode', async ({ page }) => {
    const sampleSql = `
      CREATE TABLE posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL
      );
    `;

    await page.fill('#sql-knex-input', sampleSql);
    await page.selectOption('#knex-language', 'javascript');

    const output = page.locator('#knex-output');
    await expect(output).toHaveValue(/exports\.up = function\(knex\)/);
    await expect(output).toHaveValue(/exports\.down = function\(knex\)/);
    await expect(output).not.toHaveValue(/import { Knex }/);
  });

  test('loads quick presets correctly', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    const input = page.locator('#sql-knex-input');
    await expect(input).toHaveValue(/CREATE TABLE categories/);
    await expect(input).toHaveValue(/CREATE TABLE products/);

    const output = page.locator('#knex-output');
    await expect(output).toHaveValue(/createTable\('categories'/);
    await expect(output).toHaveValue(/createTable\('products'/);
  });

  test('clears input and output on clear button click', async ({ page }) => {
    await page.fill('#sql-knex-input', 'CREATE TABLE test (id INT PRIMARY KEY);');
    await expect(page.locator('#knex-output')).not.toHaveValue('');

    await page.click('button:has-text("Effacer")');
    await expect(page.locator('#sql-knex-input')).toHaveValue('');
    await expect(page.locator('#knex-output')).toHaveValue('');
  });
});
