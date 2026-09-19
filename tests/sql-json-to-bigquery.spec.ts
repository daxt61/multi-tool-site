import { test, expect } from '@playwright/test';

test.describe('JSON to BigQuery and SQL to BigQuery Tool Suite', () => {
  test('JSON to BigQuery converts JSON payloads and supports presets, casing, and output formats', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-bigquery');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#json-bq-input')).toBeVisible();
    await expect(page.locator('#bq-output')).toBeVisible();

    // Check initial conversion output
    const initialOutput = await page.locator('#bq-output').inputValue();
    expect(initialOutput).toContain('user_id');
    expect(initialOutput).toContain('STRING');
    expect(initialOutput).toContain('RECORD');

    // Test Quick Preset application
    const presetBtn = page.getByRole('button', { name: /E-Commerce Order Payload/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    const presetOutput = await page.locator('#bq-output').inputValue();
    expect(presetOutput).toContain('order_id');
    expect(presetOutput).toContain('total_amount');
    expect(presetOutput).toContain('shipping_address');

    // Test Casing option
    await page.locator('#bq-casing-select').selectOption('camelCase');
    const camelOutput = await page.locator('#bq-output').inputValue();
    expect(camelOutput).toContain('orderId');
    expect(camelOutput).toContain('totalAmount');

    // Test Output Mode: BigQuery CREATE TABLE DDL
    await page.locator('#bq-output-format').selectOption('sql_ddl');
    const ddlOutput = await page.locator('#bq-output').inputValue();
    expect(ddlOutput).toContain('CREATE TABLE `analytics.events`');
    expect(ddlOutput).toContain('orderId STRING');
    expect(ddlOutput).toContain('customerId INT64');
    expect(ddlOutput).toContain('STRUCT<');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.click();
    await expect(page.locator('#json-bq-input')).toHaveValue('');
    await expect(page.locator('#bq-output')).toHaveValue('');
    await expect(page.locator('#json-bq-input')).toBeFocused();
  });

  test('SQL to BigQuery converts SQL CREATE TABLE DDL and supports presets, casing, and DDL output', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-bigquery');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#sql-bq-input')).toBeVisible();
    await expect(page.locator('#sql-bq-output')).toBeVisible();

    // Check initial conversion output
    const initialOutput = await page.locator('#sql-bq-output').inputValue();
    expect(initialOutput).toContain('order_id');
    expect(initialOutput).toContain('INT64');
    expect(initialOutput).toContain('REQUIRED');

    // Test Quick Preset application
    const userPresetBtn = page.getByRole('button', { name: /User Accounts & Profiles/i });
    await expect(userPresetBtn).toBeVisible();
    await userPresetBtn.click();

    const userPresetOutput = await page.locator('#sql-bq-output').inputValue();
    expect(userPresetOutput).toContain('email');
    expect(userPresetOutput).toContain('full_name');

    // Test Casing option
    await page.locator('#sql-bq-casing-select').selectOption('camelCase');
    const camelOutput = await page.locator('#sql-bq-output').inputValue();
    expect(camelOutput).toContain('fullName');

    // Test Output Mode: BigQuery CREATE TABLE DDL
    await page.locator('#sql-bq-output-format').selectOption('sql_ddl');
    const ddlOutput = await page.locator('#sql-bq-output').inputValue();
    expect(ddlOutput).toContain('CREATE TABLE `analytics.users`');
    expect(ddlOutput).toContain('email STRING NOT NULL');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.click();
    await expect(page.locator('#sql-bq-input')).toHaveValue('');
    await expect(page.locator('#sql-bq-output')).toHaveValue('');
    await expect(page.locator('#sql-bq-input')).toBeFocused();
  });
});
