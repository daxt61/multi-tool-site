import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Protobuf Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/outil/sql-to-protobuf');
    await page.waitForLoadState('networkidle');
  });

  test('renders tool title and options correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL DDL to Protobuf');
    await expect(page.locator('#package-name-input')).toHaveValue('model');
    await expect(page.locator('#syntax-version-select')).toHaveValue('proto3');
    await expect(page.locator('#casing-mode-select')).toHaveValue('snake_case');
    await expect(page.locator('#timestamp-type-select')).toHaveValue('timestamp');
  });

  test('loads quick presets and generates .proto messages', async ({ page }) => {
    await page.click('button:has-text("E-Commerce Catalog")');

    const outputText = await page.locator('#proto-output').inputValue();
    expect(outputText).toContain('syntax = "proto3";');
    expect(outputText).toContain('package model;');
    expect(outputText).toContain('import "google/protobuf/timestamp.proto";');
    expect(outputText).toContain('message Categories {');
    expect(outputText).toContain('int32 id = 1;');
    expect(outputText).toContain('string name = 2;');
    expect(outputText).toContain('message Products {');
    expect(outputText).toContain('google.protobuf.Timestamp created_at = 8;');
  });

  test('updates syntax version, field casing, and timestamp options', async ({ page }) => {
    await page.fill('#sql-proto-input', `
      CREATE TABLE test_table (
        user_id INT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP
      );
    `);

    // Switch casing to camelCase
    await page.selectOption('#casing-mode-select', 'camelCase');
    let output = await page.locator('#proto-output').inputValue();
    expect(output).toContain('int32 userId = 1;');
    expect(output).toContain('string firstName = 2;');
    expect(output).toContain('google.protobuf.Timestamp createdAt = 3;');

    // Switch timestamp type to string
    await page.selectOption('#timestamp-type-select', 'string');
    output = await page.locator('#proto-output').inputValue();
    expect(output).not.toContain('import "google/protobuf/timestamp.proto";');
    expect(output).toContain('string createdAt = 3;');

    // Switch syntax version to proto2
    await page.selectOption('#syntax-version-select', 'proto2');
    output = await page.locator('#proto-output').inputValue();
    expect(output).toContain('syntax = "proto2";');
    expect(output).toContain('optional string createdAt = 3;');
  });

  test('sanitizes reserved keywords', async ({ page }) => {
    await page.fill('#sql-proto-input', `
      CREATE TABLE message (
        package INT PRIMARY KEY,
        syntax VARCHAR(50) NOT NULL,
        import BOOLEAN
      );
    `);

    const output = await page.locator('#proto-output').inputValue();
    expect(output).toContain('message MessageMessage {');
    expect(output).toContain('int32 package_ = 1;');
    expect(output).toContain('string syntax_ = 2;');
    expect(output).toContain('bool import_ = 3;');
  });

  test('handles keyboard shortcuts (Escape and C)', async ({ page }) => {
    await page.fill('#sql-proto-input', 'CREATE TABLE items (id INT);');
    await expect(page.locator('#proto-output')).not.toHaveValue('');

    // Focus input and press Escape to clear
    await page.focus('#sql-proto-input');
    await page.keyboard.press('Escape');

    await expect(page.locator('#sql-proto-input')).toHaveValue('');
    await expect(page.locator('#proto-output')).toHaveValue('');
  });
});
