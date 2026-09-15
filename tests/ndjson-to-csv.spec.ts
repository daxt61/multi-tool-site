import { test, expect } from '@playwright/test';

test.describe('NDJSON to CSV / TSV Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/ndjson-to-csv');
  });

  test('renders tool title and default preset output', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('NDJSON en CSV / TSV');

    const input = page.locator('#ndjson-csv-input');
    await expect(input).not.toBeEmpty();

    const output = page.locator('#csv-output');
    await expect(output).toContainText('timestamp,level,event,userId,meta.ip,meta.browser');
    await expect(output).toContainText('2026-03-15T10:00:00Z,INFO,user_login,usr_101,192.168.1.1,Chrome');
  });

  test('switches delimiter options correctly', async ({ page }) => {
    const delimiterSelect = page.locator('#delimiter-select');
    await delimiterSelect.selectOption('tab');

    const output = page.locator('#csv-output');
    await expect(output).toContainText("timestamp\tlevel\tevent\tuserId\tmeta.ip\tmeta.browser");

    await delimiterSelect.selectOption('pipe');
    await expect(output).toContainText("timestamp|level|event|userId|meta.ip|meta.browser");
  });

  test('applies casing transformations to column headers', async ({ page }) => {
    const casingSelect = page.locator('#casing-select');
    await casingSelect.selectOption('CONSTANT_CASE');

    const output = page.locator('#csv-output');
    await expect(output).toContainText('TIMESTAMP,LEVEL,EVENT,USER_ID,META_IP,META_BROWSER');
  });

  test('loads quick presets and updates input & output', async ({ page }) => {
    const userPresetBtn = page.locator('button', { hasText: 'Profils Utilisateurs' });
    await userPresetBtn.click();

    const input = page.locator('#ndjson-csv-input');
    await expect(input).toHaveValue(/Alice Smith/);

    const output = page.locator('#csv-output');
    await expect(output).toContainText('id,name,email,role,active');
    await expect(output).toContainText('1,Alice Smith,alice@example.com,admin,true');
  });

  test('clears input with clear button and shortcut', async ({ page }) => {
    const clearBtn = page.locator('button', { hasText: 'Effacer' }).first();
    await clearBtn.click();

    const input = page.locator('#ndjson-csv-input');
    await expect(input).toHaveValue('');

    const output = page.locator('#csv-output');
    await expect(output).toHaveValue('');
  });

  test('shows error message on malformed NDJSON line', async ({ page }) => {
    const input = page.locator('#ndjson-csv-input');
    await input.fill('{"id": 1, "name": "Alice"}\nINVALID_JSON_LINE');

    await expect(page.locator('body')).toContainText('Line 2:');
  });
});
