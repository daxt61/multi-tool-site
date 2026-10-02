import { test, expect } from '@playwright/test';

test.describe('SQL to SeaORM Entity Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-seaorm');
  });

  test('renders input/output areas, options, and preset buttons', async ({ page }) => {
    await expect(page.locator('#sql-seaorm-input')).toBeVisible();
    await expect(page.locator('#seaorm-output')).toBeVisible();
    await expect(page.locator('#seaorm-output-mode')).toBeVisible();
    await expect(page.locator('#seaorm-casing')).toBeVisible();
    await expect(page.getByRole('button', { name: /Catalogue E-Commerce/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Authentification & Rôles/i })).toBeVisible();
  });

  test('loads preset and converts SQL DDL to Rust SeaORM Entity code', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();

    const outputText = await page.locator('#seaorm-output').inputValue();
    expect(outputText).toContain('use sea_orm::entity::prelude::*;');
    expect(outputText).toContain('#[sea_orm(table_name = "products")]');
    expect(outputText).toContain('DeriveEntityModel');
    expect(outputText).toContain('pub struct Model');
    expect(outputText).toContain('pub enum Relation');
    expect(outputText).toContain('impl ActiveModelBehavior for ActiveModel {}');
  });

  test('updates generated output when options change', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();

    // Switch casing to camelCase
    await page.locator('#seaorm-casing').selectOption('camelCase');
    let outputText = await page.locator('#seaorm-output').inputValue();
    expect(outputText).toContain('pub parentId');

    // Switch output mode to model_only
    await page.locator('#seaorm-output-mode').selectOption('model_only');
    outputText = await page.locator('#seaorm-output').inputValue();
    expect(outputText).not.toContain('pub mod categories');
  });

  test('escapes Rust reserved keywords using raw identifier syntax r#', async ({ page }) => {
    const sql = `CREATE TABLE items (
      id INT PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      match INT NOT NULL
    );`;

    await page.locator('#sql-seaorm-input').fill(sql);

    const outputText = await page.locator('#seaorm-output').inputValue();
    expect(outputText).toContain('pub r#type: String');
    expect(outputText).toContain('pub r#match: i32');
  });

  test('clears input with clear button and restores focus', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();
    expect(await page.locator('#sql-seaorm-input').inputValue()).not.toBe('');

    await page.getByRole('button', { name: /Effacer/i }).click();

    expect(await page.locator('#sql-seaorm-input').inputValue()).toBe('');
    expect(await page.locator('#seaorm-output').inputValue()).toBe('');

    // Check focus restoration
    await expect(page.locator('#sql-seaorm-input')).toBeFocused();
  });
});
