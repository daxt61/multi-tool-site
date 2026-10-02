import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Apache Thrift Generator', () => {
  test('SQL to Thrift: Converts SQL CREATE TABLE to Thrift IDL struct definitions and handles presets & options', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-thrift');
    await page.waitForLoadState('networkidle');

    // 1. Verify Title & Inputs
    await expect(page.locator('h1')).toContainText('SQL DDL en Apache Thrift');
    const inputArea = page.locator('#sql-thrift-input');
    const outputArea = page.locator('#thrift-output');
    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // 2. Load Preset: E-Commerce Catalog
    const ecommercePresetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommercePresetBtn.click();

    // Verify converted Thrift schema
    await expect(outputArea).toHaveValue(/namespace py app\.models/);
    await expect(outputArea).toHaveValue(/struct Categories \{/);
    await expect(outputArea).toHaveValue(/1: required i32 id;/);
    await expect(outputArea).toHaveValue(/2: required string name;/);
    await expect(outputArea).toHaveValue(/4: optional i32 parentId;/);
    await expect(outputArea).toHaveValue(/struct Products \{/);
    await expect(outputArea).toHaveValue(/required double price;/);
    await expect(outputArea).toHaveValue(/required i64 createdAt;/);

    // 3. Change Namespace Scope & Package Value
    const nsLangSelect = page.locator('#namespace-lang-select');
    await nsLangSelect.selectOption('java');
    const nsValueInput = page.locator('#namespace-value-input');
    await nsValueInput.fill('com.example.thrift');

    await expect(outputArea).toHaveValue(/namespace java com\.example\.thrift/);

    // 4. Change Field Casing
    const casingSelect = page.locator('#casing-mode-select');
    await casingSelect.selectOption('snake_case');
    await expect(outputArea).toHaveValue(/4: optional i32 parent_id;/);

    // 5. Change Qualifiers
    const qualifierSelect = page.locator('#qualifier-mode-select');
    await qualifierSelect.selectOption('required_all');
    await expect(outputArea).toHaveValue(/4: required i32 parent_id;/);

    // 6. Test Copy Button & Toast
    const copyBtn = page.getByRole('button', { name: /Copier/i }).last();
    await copyBtn.click();
    await expect(page.locator('ol[tabindex="-1"]')).toContainText('Schéma Apache Thrift copié dans le presse-papiers !');

    // 7. Test Keyboard Shortcut: Esc clears and restores focus
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('SQL to Thrift: Handles custom DDL, reserved keywords, and timestamp options', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-thrift');
    await page.waitForLoadState('networkidle');

    const inputArea = page.locator('#sql-thrift-input');
    const outputArea = page.locator('#thrift-output');

    await inputArea.fill(`
CREATE TABLE custom_struct (
  id INT PRIMARY KEY,
  struct VARCHAR(50),
  service TEXT NOT NULL,
  event_time TIMESTAMP NOT NULL
);
    `);

    // Verify sanitization of reserved keywords 'struct' and 'service'
    await expect(outputArea).toHaveValue(/struct CustomStruct \{/);
    await expect(outputArea).toHaveValue(/struct_field;/);
    await expect(outputArea).toHaveValue(/service_field;/);

    // Change Timestamp Type to string
    const timestampSelect = page.locator('#timestamp-type-select');
    await timestampSelect.selectOption('string');
    await expect(outputArea).toHaveValue(/required string eventTime;/);
  });
});
