import { test, expect } from '@playwright/test';

test.describe('JSON to TypeBox Schema Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-typebox');
    await page.waitForLoadState('networkidle');
  });

  test('renders component elements and default TypeBox schema output correctly', async ({ page }) => {
    await expect(page.locator('label[for="typebox-json-input"]')).toBeVisible();
    await expect(page.locator('label[for="typebox-output"]')).toBeVisible();

    const input = page.locator('#typebox-json-input');
    const output = page.locator('#typebox-output');

    await expect(input).not.toBeEmpty();
    await expect(output).not.toBeEmpty();

    const outputVal = await output.inputValue();
    expect(outputVal).toContain("import { Type, Static } from '@sinclair/typebox';");
    expect(outputVal).toContain('export const UserSchema = Type.Object(');
    expect(outputVal).toContain('username: Type.String()');
    expect(outputVal).toContain('age: Type.Number()');
    expect(outputVal).toContain('export type UserType = Static<typeof UserSchema>;');
  });

  test('updates TypeBox schema output when casing option changes', async ({ page }) => {
    const casingSelect = page.locator('#typebox-casing');
    const output = page.locator('#typebox-output');

    await casingSelect.selectOption('snake_case');
    await page.waitForTimeout(300);

    const outputVal = await output.inputValue();
    expect(outputVal).toContain('is_verified: Type.Boolean()');
    expect(outputVal).toContain('avatar_url: Type.String()');
  });

  test('loads quick presets and updates input & output', async ({ page }) => {
    const input = page.locator('#typebox-json-input');
    const output = page.locator('#typebox-output');

    const productPresetBtn = page.getByRole('button', { name: /Catalogue Produits/i });
    await productPresetBtn.click();
    await page.waitForTimeout(300);

    const inputVal = await input.inputValue();
    expect(inputVal).toContain('PROD-LPT-001');

    const outputVal = await output.inputValue();
    expect(outputVal).toContain('export const ProductSchema = Type.Object(');
    expect(outputVal).toContain('price: Type.Readonly(Type.Number())');
  });

  test('clears input on Escape keypress', async ({ page }) => {
    const input = page.locator('#typebox-json-input');
    const output = page.locator('#typebox-output');

    await expect(input).not.toBeEmpty();

    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toBeEmpty();
    await expect(output).toBeEmpty();
    await expect(input).toBeFocused();
  });

  test('displays error on invalid JSON payload', async ({ page }) => {
    const input = page.locator('#typebox-json-input');
    const output = page.locator('#typebox-output');

    await input.fill('{ invalid_json: true, }');
    await page.waitForTimeout(300);

    await expect(page.locator('div').filter({ hasText: /JSON/i }).first()).toBeVisible();
    await expect(output).toHaveValue('');
  });
});

test.describe('CSV / TSV to NDJSON Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-to-ndjson');
    await page.waitForLoadState('networkidle');
  });

  test('renders component elements and converts default CSV payload to NDJSON', async ({ page }) => {
    await expect(page.locator('label[for="csv-ndjson-input"]')).toBeVisible();
    await expect(page.locator('label[for="csv-ndjson-output"]')).toBeVisible();

    const input = page.locator('#csv-ndjson-input');
    const output = page.locator('#csv-ndjson-output');

    await expect(input).not.toBeEmpty();
    await expect(output).not.toBeEmpty();

    const outputVal = await output.inputValue();
    const lines = outputVal.trim().split('\n');
    expect(lines.length).toBe(3);

    const firstRow = JSON.parse(lines[0]);
    expect(firstRow).toEqual({ id: 101, name: 'Alice Smith', email: 'alice@example.com', age: 29, active: true });
  });

  test('loads TSV preset and converts tab-separated data', async ({ page }) => {
    const input = page.locator('#csv-ndjson-input');
    const output = page.locator('#csv-ndjson-output');

    const logsPresetBtn = page.getByRole('button', { name: /Journaux Serveur TSV/i });
    await logsPresetBtn.click();
    await page.waitForTimeout(300);

    const inputVal = await input.inputValue();
    expect(inputVal).toContain("auth-service\t200\t/api/v1/login");

    const outputVal = await output.inputValue();
    const lines = outputVal.trim().split('\n');
    expect(lines.length).toBe(3);

    const firstRow = JSON.parse(lines[0]);
    expect(firstRow.service).toBe('auth-service');
    expect(firstRow.status_code).toBe(200);
  });

  test('clears input on Escape keypress', async ({ page }) => {
    const input = page.locator('#csv-ndjson-input');
    const output = page.locator('#csv-ndjson-output');

    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toBeEmpty();
    await expect(output).toBeEmpty();
    await expect(input).toBeFocused();
  });
});

test.describe('Bidirectional NDJSON Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/ndjson-converter');
    await page.waitForLoadState('networkidle');
  });

  test('renders NDJSON to JSON Array conversion by default', async ({ page }) => {
    await expect(page.locator('label[for="ndjson-input"]')).toBeVisible();
    await expect(page.locator('label[for="ndjson-output"]')).toBeVisible();

    const input = page.locator('#ndjson-input');
    const output = page.locator('#ndjson-output');

    await expect(input).not.toBeEmpty();
    await expect(output).not.toBeEmpty();

    const outputVal = await output.inputValue();
    const parsed = JSON.parse(outputVal);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);
    expect(parsed[0].name).toBe('Alice');
  });

  test('swaps direction using S key and converts JSON Array to NDJSON', async ({ page }) => {
    const eventsPresetBtn = page.getByRole('button', { name: /Journaux d'Événements/i });
    await eventsPresetBtn.click();
    await page.waitForTimeout(300);

    const output = page.locator('#ndjson-output');
    const outputVal = await output.inputValue();

    const lines = outputVal.trim().split('\n');
    expect(lines.length).toBe(3);
    expect(JSON.parse(lines[0]).event).toBe('user_login');
  });

  test('clears input on Escape keypress', async ({ page }) => {
    const input = page.locator('#ndjson-input');
    const output = page.locator('#ndjson-output');

    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toBeEmpty();
    await expect(output).toBeEmpty();
    await expect(input).toBeFocused();
  });
});
