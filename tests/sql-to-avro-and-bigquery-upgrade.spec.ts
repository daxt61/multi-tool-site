import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Avro & Upgraded BigQuery Tool Suite', () => {
  test('SQL to Avro converts DDL queries to .avsc JSON schema with options and presets', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/sql-to-avro');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#sql-avro-input')).toBeVisible();
    await expect(page.locator('#avro-output')).toBeVisible();

    // Check default preset (E-Commerce Catalog) conversion output
    const defaultOutput = await page.locator('#avro-output').inputValue();
    expect(defaultOutput).toContain('"type": "record"');
    expect(defaultOutput).toContain('"name": "Products"');
    expect(defaultOutput).toContain('"namespace": "com.example.avro"');
    expect(defaultOutput).toContain('"name": "price"');
    expect(defaultOutput).toContain('"logicalType": "timestamp-millis"');

    // Test Quick Preset application (User Auth & Roles)
    const userAuthPresetBtn = page.getByRole('button', { name: /User Auth & Roles/i });
    await expect(userAuthPresetBtn).toBeVisible();
    await userAuthPresetBtn.click();

    const userOutput = await page.locator('#avro-output').inputValue();
    expect(userOutput).toContain('"name": "Users"');
    expect(userOutput).toContain('"name": "username"');
    expect(userOutput).toContain('"name": "password_hash"');

    // Test Field Casing option (camelCase)
    await page.locator('#avro-casing-select').selectOption('camelCase');
    const camelOutput = await page.locator('#avro-output').inputValue();
    expect(camelOutput).toContain('"name": "userId"');
    expect(camelOutput).toContain('"name": "passwordHash"');

    // Test Custom Namespace input
    await page.locator('#avro-namespace-input').fill('com.mycompany.domain');
    const nsOutput = await page.locator('#avro-output').inputValue();
    expect(nsOutput).toContain('"namespace": "com.mycompany.domain"');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: /Clear/i }).first();
    await clearBtn.click();
    await expect(page.locator('#sql-avro-input')).toHaveValue('');
    await expect(page.locator('#avro-output')).toHaveValue('');
    await expect(page.locator('#sql-avro-input')).toBeFocused();
  });

  test('Upgraded SQL to BigQuery supports Palette UX, presets, output modes and casing', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/sql-to-bigquery');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#sql-bq-input')).toBeVisible();
    await expect(page.locator('#sql-bq-output')).toBeVisible();

    // Verify initial conversion output (JSON Schema Array)
    const initialOutput = await page.locator('#sql-bq-output').inputValue();
    expect(initialOutput).toContain('"name": "order_id"');
    expect(initialOutput).toContain('"type": "INT64"');
    expect(initialOutput).toContain('"mode": "NULLABLE"');

    // Test Preset switching (User Accounts & Profiles)
    const userProfilePresetBtn = page.getByRole('button', { name: /User Accounts & Profiles/i });
    await expect(userProfilePresetBtn).toBeVisible();
    await userProfilePresetBtn.click();

    const userOutput = await page.locator('#sql-bq-output').inputValue();
    expect(userOutput).toContain('"name": "user_id"');
    expect(userOutput).toContain('"name": "email"');

    // Test Output Mode switching to BigQuery CREATE TABLE DDL
    await page.locator('#sql-bq-output-format').selectOption('sql_ddl');
    const ddlOutput = await page.locator('#sql-bq-output').inputValue();
    expect(ddlOutput).toContain('CREATE TABLE `analytics.users` (');
    expect(ddlOutput).toContain('user_id STRING NOT NULL');

    // Test Field Casing option (camelCase)
    await page.locator('#sql-bq-casing-select').selectOption('camelCase');
    const camelOutput = await page.locator('#sql-bq-output').inputValue();
    expect(camelOutput).toContain('fullName STRING');
    expect(camelOutput).toContain('lastLoginAt DATETIME');

    // Test Clear button and focus restoration
    const clearBtn = page.getByRole('button', { name: /Clear/i }).first();
    await clearBtn.click();
    await expect(page.locator('#sql-bq-input')).toHaveValue('');
    await expect(page.locator('#sql-bq-output')).toHaveValue('');
    await expect(page.locator('#sql-bq-input')).toBeFocused();
  });
});
