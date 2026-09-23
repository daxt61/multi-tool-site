import { test, expect } from '@playwright/test';

test.describe('SQLToDynamoDB Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/sql-to-dynamodb');
    await page.waitForSelector('#sql-dynamo-input');
  });

  test('converts SQL CREATE TABLE DDL to DynamoDB CreateTable JSON Schema', async ({ page }) => {
    const input = page.locator('#sql-dynamo-input');
    const output = page.locator('#dynamo-output');

    await input.fill(`CREATE TABLE products (
      id VARCHAR(64) NOT NULL,
      category VARCHAR(32) NOT NULL,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      PRIMARY KEY (id, category)
    );`);

    await expect(output).toHaveValue(/TableName.*products/);
    await expect(output).toHaveValue(/AttributeDefinitions/);
    await expect(output).toHaveValue(/KeySchema/);
    await expect(output).toHaveValue(/HASH/);
    await expect(output).toHaveValue(/RANGE/);
  });

  test('switches output target mode to AWS SDK v3 code', async ({ page }) => {
    const input = page.locator('#sql-dynamo-input');
    const output = page.locator('#dynamo-output');

    await input.fill(`CREATE TABLE user_sessions (
      user_id VARCHAR(128) NOT NULL PRIMARY KEY,
      session_token VARCHAR(255) NOT NULL
    );`);

    await page.getByRole('button', { name: 'AWS SDK v3 (JS/TS)' }).click();

    await expect(output).toHaveValue(/import { DynamoDBClient, CreateTableCommand } from "@aws-sdk\/client-dynamodb"/);
    await expect(output).toHaveValue(/new CreateTableCommand/);
  });

  test('switches output target mode to PartiQL statement', async ({ page }) => {
    const input = page.locator('#sql-dynamo-input');
    const output = page.locator('#dynamo-output');

    await input.fill(`INSERT INTO products (id, category, title, price) VALUES ('p101', 'electronics', 'Mouse', 29.99);`);

    await page.getByRole('button', { name: /PartiQL/i }).click();

    await expect(output).toHaveValue(/INSERT INTO "products" VALUE/);
    await expect(output).toHaveValue(/"p101"/);
  });

  test('loads presets correctly and updates output', async ({ page }) => {
    const input = page.locator('#sql-dynamo-input');
    const output = page.locator('#dynamo-output');

    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();

    await expect(input).toHaveValue(/CREATE TABLE products/);
    await expect(output).toHaveValue(/TableName.*products/);
  });

  test('clears input and output when clear button is clicked', async ({ page }) => {
    const input = page.locator('#sql-dynamo-input');
    const output = page.locator('#dynamo-output');

    await input.fill(`CREATE TABLE test (id INT PRIMARY KEY);`);
    await expect(output).not.toHaveValue('');

    await page.getByRole('button', { name: /(clear|effacer)/i }).click();

    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });
});
