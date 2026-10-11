import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4173' });

test.describe('GraphQLToSeaORM and SQLToSeaORM Tools', () => {
  test('GraphQLToSeaORM converts GraphQL SDL schema to SeaORM Rust models', async ({ page }) => {
    await page.goto('/en/outil/graphql-to-seaorm');
    await page.waitForLoadState('networkidle');

    // Input GraphQL SDL
    const inputTextArea = page.locator('#graphql-seaorm-input');
    await expect(inputTextArea).toBeVisible();

    const sampleGql = `
type Product {
  id: ID!
  title: String!
  price: Float!
  isActive: Boolean
}

enum Status {
  ACTIVE
  INACTIVE
}
`;

    await inputTextArea.fill(sampleGql);

    const outputTextArea = page.locator('#gql-seaorm-output');
    await expect(outputTextArea).toBeVisible();

    // Verify generated SeaORM output
    const outputValue = await outputTextArea.inputValue();
    expect(outputValue).toContain('use sea_orm::entity::prelude::*;');
    expect(outputValue).toContain('pub enum Status {');
    expect(outputValue).toContain('pub struct Model {');
    expect(outputValue).toContain('pub id: i32,');
    expect(outputValue).toContain('pub title: String,');
    expect(outputValue).toContain('pub price: f64,');
    expect(outputValue).toContain('pub is_active: Option<bool>,');

    // Test preset click
    const presetBtn = page.locator('button', { hasText: /Catalogue E-Commerce|E-Commerce Catalog/i }).first();
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    const presetOutput = await outputTextArea.inputValue();
    expect(presetOutput).toContain('pub mod category {');
    expect(presetOutput).toContain('pub mod product {');
  });

  test('SQLToSeaORM converts SQL CREATE TABLE DDL to SeaORM Rust models', async ({ page }) => {
    await page.goto('/en/outil/sql-to-seaorm');
    await page.waitForLoadState('networkidle');

    const inputTextArea = page.locator('#sql-seaorm-input');
    await expect(inputTextArea).toBeVisible();

    const sampleSql = `
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP
);
`;

    await inputTextArea.fill(sampleSql);

    const outputTextArea = page.locator('#seaorm-output');
    await expect(outputTextArea).toBeVisible();

    const outputValue = await outputTextArea.inputValue();
    expect(outputValue).toContain('use sea_orm::entity::prelude::*;');
    expect(outputValue).toContain('pub struct Model {');
    expect(outputValue).toContain('pub id: i32,');
    expect(outputValue).toContain('pub email: String,');
    expect(outputValue).toContain('pub created_at: Option<DateTime>,');

    // Test preset click
    const presetBtn = page.locator('button', { hasText: /User Auth & Roles|Authentification/i }).first();
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    const presetOutput = await outputTextArea.inputValue();
    expect(presetOutput).toContain('pub mod users {');
    expect(presetOutput).toContain('pub mod roles {');
  });
});
