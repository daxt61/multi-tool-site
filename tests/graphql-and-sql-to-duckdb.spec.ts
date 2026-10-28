import { test, expect } from '@playwright/test';

test.describe('GraphQL & SQL to DuckDB Converters', () => {
  test('SQLToDuckDB converts SQL DDL to DuckDB with presets and options', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-duckdb');

    await expect(page.locator('h1')).toContainText('SQL DDL en DuckDB');

    // Test default preset output
    const outputArea = page.locator('#duckdb-output');
    await expect(outputArea).toContainText('CREATE TABLE IF NOT EXISTS "orders"');
    await expect(outputArea).toContainText('"order_id" BIGINT NOT NULL');
    await expect(outputArea).toContainText('"customer_id" UUID NOT NULL');
    await expect(outputArea).toContainText('PRIMARY KEY ("order_id")');

    // Test output style selection
    const styleSelect = page.locator('#sql-duckdb-style');
    await styleSelect.selectOption('python_api');
    await expect(outputArea).toContainText('import duckdb');
    await expect(outputArea).toContainText('con.sql("""');

    // Test preset button click
    const presetBtn = page.getByRole('button', { name: 'User Event Log & Metrics' });
    await presetBtn.click();
    await expect(outputArea).toContainText('"user_events"');
    await expect(outputArea).toContainText('HUGEINT');
  });

  test('GraphQLToDuckDB converts GraphQL SDL to DuckDB with presets and options', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-duckdb');

    await expect(page.locator('h1')).toContainText('GraphQL en DuckDB');

    const outputArea = page.locator('#duckdb-output');
    await expect(outputArea).toContainText('CREATE TABLE IF NOT EXISTS "order"');
    await expect(outputArea).toContainText('"id" UUID NOT NULL');
    await expect(outputArea).toContainText('"order_number" VARCHAR NOT NULL');

    // Test field casing option
    const casingSelect = page.locator('#graphql-duckdb-casing');
    await casingSelect.selectOption('camelCase');
    await expect(outputArea).toContainText('"orderNumber" VARCHAR NOT NULL');

    // Test output style selection
    const styleSelect = page.locator('#graphql-duckdb-style');
    await styleSelect.selectOption('node_api');
    await expect(outputArea).toContainText("import { DuckDBInstance } from '@duckdb/node-api'");

    // Test preset button click
    const presetBtn = page.getByRole('button', { name: 'User Telemetry & Logs' });
    await presetBtn.click();
    await expect(outputArea).toContainText('"userEvent"');
  });
});
