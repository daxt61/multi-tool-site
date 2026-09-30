import { test, expect } from '@playwright/test';

test.describe('SQL to DuckDB Tool Suite', () => {
  test('SQL to DuckDB converts DDL statements and supports output styles, casing, and presets', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-duckdb');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#sql-duckdb-input')).toBeVisible();
    await expect(page.locator('#duckdb-output')).toBeVisible();

    // Check initial conversion output (E-Commerce Analytics preset)
    const initialOutput = await page.locator('#duckdb-output').inputValue();
    expect(initialOutput).toContain('CREATE TABLE IF NOT EXISTS "orders"');
    expect(initialOutput).toContain('"order_id" BIGINT NOT NULL');
    expect(initialOutput).toContain('"customer_id" UUID NOT NULL');
    expect(initialOutput).toContain('"placed_at" TIMESTAMPTZ NOT NULL');
    expect(initialOutput).toContain('PRIMARY KEY ("order_id")');

    // Test Quick Preset application (User Event Log & Metrics)
    const eventLogPresetBtn = page.getByRole('button', { name: /User Event Log & Metrics/i });
    await expect(eventLogPresetBtn).toBeVisible();
    await eventLogPresetBtn.click();

    const eventOutput = await page.locator('#duckdb-output').inputValue();
    expect(eventOutput).toContain('CREATE TABLE IF NOT EXISTS "user_events"');
    expect(eventOutput).toContain('"user_id" HUGEINT NOT NULL');
    expect(eventOutput).toContain('"event_id" UUID NOT NULL');

    // Test Output Style option (Python DuckDB API)
    await page.locator('#sql-duckdb-style').selectOption('python_api');
    const pyOutput = await page.locator('#duckdb-output').inputValue();
    expect(pyOutput).toContain('import duckdb');
    expect(pyOutput).toContain("con = duckdb.connect('analytics.duckdb')");
    expect(pyOutput).toContain('df = con.sql("SELECT * FROM user_events").df()');

    // Test Output Style option (Parquet COPY)
    await page.locator('#sql-duckdb-style').selectOption('parquet_export');
    const pqOutput = await page.locator('#duckdb-output').inputValue();
    expect(pqOutput).toContain("COPY \"user_events\" TO 'user_events.parquet' (FORMAT PARQUET, COMPRESSION ZSTD);");
    expect(pqOutput).toContain("SELECT * FROM read_parquet('user_events.parquet') LIMIT 10;");

    // Test Field Casing option (camelCase)
    await page.locator('#sql-duckdb-casing').selectOption('camelCase');
    const camelOutput = await page.locator('#duckdb-output').inputValue();
    expect(camelOutput).toContain('"userId"');
    expect(camelOutput).toContain('"eventId"');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.click();
    await expect(page.locator('#sql-duckdb-input')).toHaveValue('');
    await expect(page.locator('#duckdb-output')).toHaveValue('');
    await expect(page.locator('#sql-duckdb-input')).toBeFocused();
  });
});
