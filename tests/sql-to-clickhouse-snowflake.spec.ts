import { test, expect } from '@playwright/test';

test.describe('SQL to ClickHouse and SQL to Snowflake Tool Suite', () => {
  test('SQL to ClickHouse converts DDL statements and supports engines, casing, and presets', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-clickhouse');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#sql-clickhouse-input')).toBeVisible();
    await expect(page.locator('#clickhouse-output')).toBeVisible();

    // Check initial conversion output
    const initialOutput = await page.locator('#clickhouse-output').inputValue();
    expect(initialOutput).toContain('CREATE TABLE `event_logs`');
    expect(initialOutput).toContain('ENGINE = MergeTree()');
    expect(initialOutput).toContain('`event_id` String');
    expect(initialOutput).toContain('`created_at` DateTime64(3)');

    // Test Quick Preset application
    const sessionPresetBtn = page.getByRole('button', { name: /User Analytics & Sessions/i });
    await expect(sessionPresetBtn).toBeVisible();
    await sessionPresetBtn.click();

    const sessionOutput = await page.locator('#clickhouse-output').inputValue();
    expect(sessionOutput).toContain('CREATE TABLE `user_sessions`');
    expect(sessionOutput).toContain('`session_id` String');
    expect(sessionOutput).toContain('`duration_seconds` Nullable(Int32)');

    // Test Engine option change
    await page.locator('#sql-clickhouse-engine').selectOption('ReplacingMergeTree');
    const engineOutput = await page.locator('#clickhouse-output').inputValue();
    expect(engineOutput).toContain('ENGINE = ReplacingMergeTree()');

    // Test Casing option
    await page.locator('#sql-clickhouse-casing').selectOption('camelCase');
    const camelOutput = await page.locator('#clickhouse-output').inputValue();
    expect(camelOutput).toContain('`sessionId`');
    expect(camelOutput).toContain('`durationSeconds`');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.click();
    await expect(page.locator('#sql-clickhouse-input')).toHaveValue('');
    await expect(page.locator('#clickhouse-output')).toHaveValue('');
    await expect(page.locator('#sql-clickhouse-input')).toBeFocused();
  });

  test('SQL to Snowflake converts DDL statements and supports table types, casing, and presets', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-snowflake');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#sql-snowflake-input')).toBeVisible();
    await expect(page.locator('#snowflake-output')).toBeVisible();

    // Check initial conversion output
    const initialOutput = await page.locator('#snowflake-output').inputValue();
    expect(initialOutput).toContain('CREATE OR REPLACE TABLE DW_PRODUCTS');
    expect(initialOutput).toContain('PRODUCT_ID NUMBER(38, 0)');
    expect(initialOutput).toContain('PRICE NUMBER(10, 2) NOT NULL');
    expect(initialOutput).toContain('ATTRIBUTES VARIANT');

    // Test Quick Preset application
    const telemetryPresetBtn = page.getByRole('button', { name: /Event Telemetry & Variant Logs/i });
    await expect(telemetryPresetBtn).toBeVisible();
    await telemetryPresetBtn.click();

    const telemetryOutput = await page.locator('#snowflake-output').inputValue();
    expect(telemetryOutput).toContain('TELEMETRY_EVENTS');
    expect(telemetryOutput).toContain('DEVICE_INFO VARIANT');

    // Test Table Type option (TRANSIENT)
    await page.locator('#sql-snowflake-table-type').selectOption('TRANSIENT');
    const transientOutput = await page.locator('#snowflake-output').inputValue();
    expect(transientOutput).toContain('CREATE OR REPLACE TRANSIENT TABLE');

    // Test Casing option (snake_case)
    await page.locator('#sql-snowflake-casing').selectOption('snake_case');
    const snakeOutput = await page.locator('#snowflake-output').inputValue();
    expect(snakeOutput).toContain('telemetry_events');
    expect(snakeOutput).toContain('device_info VARIANT');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.click();
    await expect(page.locator('#sql-snowflake-input')).toHaveValue('');
    await expect(page.locator('#snowflake-output')).toHaveValue('');
    await expect(page.locator('#sql-snowflake-input')).toBeFocused();
  });
});
