import { test, expect } from '@playwright/test';

test.describe('SQL DDL to JSON Schema Generator & Upgraded Schema Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-json-schema');
  });

  test('converts default SQL DDL to JSON Schema Draft 2020-12 ($defs)', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL DDL en JSON Schema');

    const output = page.locator('#json-schema-output');
    await expect(output).not.toBeEmpty();

    const text = await output.inputValue();
    expect(text).toContain('https://json-schema.org/draft/2020-12/schema');
    expect(text).toContain('"$defs"');
    expect(text).toContain('"users"');
    expect(text).toContain('"username"');
    expect(text).toContain('"integer"');
    expect(text).toContain('"required"');
  });

  test('switches draft version, schema mode, and key casing', async ({ page }) => {
    await page.selectOption('#draft-select', '07');
    await page.selectOption('#mode-select', 'object');
    await page.selectOption('#casing-select', 'camelCase');

    const output = page.locator('#json-schema-output');
    const text = await output.inputValue();

    expect(text).toContain('http://json-schema.org/draft-07/schema#');
    expect(text).toContain('"title": "users"');
    expect(text).toContain('"isActive"');
    expect(text).toContain('"createdAt"');
  });

  test('loads quick presets and updates input & output', async ({ page }) => {
    const ordersPreset = page.getByRole('button', { name: /Commandes E-Commerce|E-Commerce Orders/i });
    await ordersPreset.click();

    const input = page.locator('#sql-jsonschema-input');
    await expect(input).toContainText('CREATE TABLE orders');

    const output = page.locator('#json-schema-output');
    const text = await output.inputValue();
    expect(text).toContain('"orders"');
    expect(text).toContain('"customer_email"');
    expect(text).toContain('"date-time"');
  });

  test('handles keyboard shortcuts (Escape to clear, C to copy)', async ({ page }) => {
    await page.keyboard.press('Escape');

    const input = page.locator('#sql-jsonschema-input');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();

    // Re-fill input
    await input.fill('CREATE TABLE test_table ( id INT NOT NULL );');
    await page.locator('#draft-select').focus(); // blur textarea

    await page.keyboard.press('c');
    await expect(page.locator('[data-sonner-toaster]')).toBeAttached();
  });

  test('interacts with upgraded JSONToYup and JSONToJoi tools', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/yup-schema');
    await expect(page.locator('h1')).toContainText('Schéma Yup');

    const yupPreset = page.getByRole('button', { name: /Produit E-Commerce|E-Commerce Product/i });
    await yupPreset.click();

    const yupOutput = page.locator('#yup-schema-output');
    await expect(yupOutput).toContainText('yup.object');

    await page.goto('http://localhost:5173/fr/outil/json-to-joi');
    await expect(page.locator('h1')).toContainText(/JSON (to|en) Joi/i);

    const joiPreset = page.getByRole('button', { name: /Configuration Serveur|Server Config/i });
    await joiPreset.click();

    const joiOutput = page.locator('#joi-schema-output');
    await expect(joiOutput).toContainText('Joi.object');
  });
});
