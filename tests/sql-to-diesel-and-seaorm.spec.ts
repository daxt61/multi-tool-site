import { test, expect } from '@playwright/test';

test.describe('SQL to Diesel ORM Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-diesel');
    await page.waitForLoadState('networkidle');
  });

  test('renders tool title and UI elements correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/SQL DDL en Diesel Rust/i);
    await expect(page.locator('label[for="sql-diesel-input"]')).toBeVisible();
    await expect(page.locator('label[for="diesel-output"]')).toBeVisible();
    await expect(page.locator('#sql-diesel-input')).toBeVisible();
    await expect(page.locator('#diesel-output')).toBeVisible();
  });

  test('converts SQL DDL into Diesel table! macro and model structs', async ({ page }) => {
    const sampleSql = `
      CREATE TABLE users (
        user_id UUID PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL
      );
    `;

    await page.fill('#sql-diesel-input', sampleSql);

    const output = page.locator('#diesel-output');
    await expect(output).toHaveValue(/diesel::table! {/);
    await expect(output).toHaveValue(/users \(user_id\) {/);
    await expect(output).toHaveValue(/user_id -> Uuid,/);
    await expect(output).toHaveValue(/username -> Varchar,/);
    await expect(output).toHaveValue(/is_active -> Nullable<Bool>,/);
    await expect(output).toHaveValue(/pub struct Users {/);
    await expect(output).toHaveValue(/pub user_id: uuid::Uuid,/);
    await expect(output).toHaveValue(/pub is_active: Option<bool>,/);
    await expect(output).toHaveValue(/pub struct NewUsers {/);
  });

  test('loads quick presets correctly', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    const input = page.locator('#sql-diesel-input');
    await expect(input).toHaveValue(/CREATE TABLE categories/);
    await expect(input).toHaveValue(/CREATE TABLE products/);

    const output = page.locator('#diesel-output');
    await expect(output).toHaveValue(/diesel::table! {/);
    await expect(output).toHaveValue(/categories \(id\) {/);
    await expect(output).toHaveValue(/products \(id\) {/);
    await expect(output).toHaveValue(/pub struct Categories/);
    await expect(output).toHaveValue(/pub struct Products/);
  });

  test('clears input and output on clear button click', async ({ page }) => {
    await page.fill('#sql-diesel-input', 'CREATE TABLE test (id INT PRIMARY KEY);');
    await expect(page.locator('#diesel-output')).not.toHaveValue('');

    await page.click('button:has-text("Effacer")');
    await expect(page.locator('#sql-diesel-input')).toHaveValue('');
    await expect(page.locator('#diesel-output')).toHaveValue('');
  });
});

test.describe('SQL to SeaORM Entity Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-seaorm');
    await page.waitForLoadState('networkidle');
  });

  test('renders tool title and UI elements correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/SQL DDL en SeaORM Rust/i);
    await expect(page.locator('label[for="sql-seaorm-input"]')).toBeVisible();
    await expect(page.locator('label[for="seaorm-output"]')).toBeVisible();
    await expect(page.locator('#sql-seaorm-input')).toBeVisible();
    await expect(page.locator('#seaorm-output')).toBeVisible();
  });

  test('converts SQL DDL into SeaORM Entity models', async ({ page }) => {
    const sampleSql = `
      CREATE TABLE users (
        user_id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE
      );
    `;

    await page.fill('#sql-seaorm-input', sampleSql);

    const output = page.locator('#seaorm-output');
    await expect(output).toHaveValue(/use sea_orm::entity::prelude::\*;$/m);
    await expect(output).toHaveValue(/#\[derive\(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize\)\]/);
    await expect(output).toHaveValue(/#\[sea_orm\(table_name = "users"\)\]/);
    await expect(output).toHaveValue(/pub struct Model {/);
    await expect(output).toHaveValue(/#\[sea_orm\(primary_key\)\]/);
    await expect(output).toHaveValue(/pub user_id: Uuid,/);
    await expect(output).toHaveValue(/pub is_verified: Option<bool>,/);
    await expect(output).toHaveValue(/pub enum Relation {}/);
    await expect(output).toHaveValue(/impl ActiveModelBehavior for ActiveModel {}/);
  });

  test('loads quick presets correctly for SeaORM', async ({ page }) => {
    await page.click('button:has-text("Catalogue E-Commerce")');
    const input = page.locator('#sql-seaorm-input');
    await expect(input).toHaveValue(/CREATE TABLE categories/);
    await expect(input).toHaveValue(/CREATE TABLE products/);

    const output = page.locator('#seaorm-output');
    await expect(output).toHaveValue(/pub mod categories {/);
    await expect(output).toHaveValue(/pub mod products {/);
  });
});
