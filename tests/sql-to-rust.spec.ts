import { test, expect } from '@playwright/test';

test.describe('SQL to Rust Struct Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-rust');
  });

  test('renders input/output areas, options, and preset buttons', async ({ page }) => {
    await expect(page.locator('#sql-rust-input')).toBeVisible();
    await expect(page.locator('#rust-output')).toBeVisible();
    await expect(page.locator('#rust-framework')).toBeVisible();
    await expect(page.locator('#rust-casing')).toBeVisible();
    await expect(page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Authentification & Rôles|User Auth & Roles/i })).toBeVisible();
  });

  test('loads preset and converts SQL DDL to Rust struct code', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();

    const inputVal = await page.locator('#sql-rust-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE categories');
    expect(inputVal).toContain('CREATE TABLE products');

    const outputVal = await page.locator('#rust-output').inputValue();
    expect(outputVal).toContain('pub struct Categories');
    expect(outputVal).toContain('pub struct Products');
    expect(outputVal).toContain('use serde::{Serialize, Deserialize};');
    expect(outputVal).toContain('pub name: String,');
    expect(outputVal).toContain('pub parent_id: Option<i32>,');
    expect(outputVal).toContain('pub price: f64,');
  });

  test('updates generated output when options change', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();

    // Select sqlx framework
    await page.locator('#rust-framework').selectOption('sqlx');
    let outputVal = await page.locator('#rust-output').inputValue();
    expect(outputVal).toContain('use sqlx::FromRow;');
    expect(outputVal).toContain('FromRow');

    // Select diesel framework
    await page.locator('#rust-framework').selectOption('diesel');
    outputVal = await page.locator('#rust-output').inputValue();
    expect(outputVal).toContain('use diesel::prelude::*;');
    expect(outputVal).toContain('Queryable');

    // Change casing to camelCase
    await page.locator('#rust-casing').selectOption('camelCase');
    outputVal = await page.locator('#rust-output').inputValue();
    expect(outputVal).toContain('pub parentId: Option<i32>,');
  });

  test('escapes Rust reserved keywords using raw identifier syntax r#', async ({ page }) => {
    await page.locator('#sql-rust-input').fill(`
      CREATE TABLE test_table (
        id INT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        fn TEXT
      );
    `);

    const outputVal = await page.locator('#rust-output').inputValue();
    expect(outputVal).toContain('pub r#type: String,');
    expect(outputVal).toContain('pub r#fn: Option<String>,');
  });

  test('clears input with clear button and restores focus', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();
    expect(await page.locator('#sql-rust-input').inputValue()).not.toBe('');

    await page.getByRole('button', { name: 'Effacer' }).click();

    expect(await page.locator('#sql-rust-input').inputValue()).toBe('');
    expect(await page.locator('#rust-output').inputValue()).toBe('');
  });
});
