import { test, expect } from '@playwright/test';

test.describe('JSONToSQL UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-sql');
  });

  test('renders initial state and converts default preset', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const sqlOutput = page.locator('#sql-output');

    await expect(jsonInput).toHaveValue(/alex_dev/);
    await expect(sqlOutput).toHaveValue(/INSERT INTO "users"/);
  });

  test('loads quick presets and updates SQL output dynamically', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const sqlOutput = page.locator('#sql-output');

    // Click 'Commandes E-Commerce' preset
    await page.click('button:has-text("Commandes E-Commerce")');

    await expect(jsonInput).toHaveValue(/ORD-1001/);
    await expect(sqlOutput).toHaveValue(/ORD-1001/);
  });

  test('supports dialect switching', async ({ page }) => {
    const dialectSelect = page.locator('#dialect-select');
    const sqlOutput = page.locator('#sql-output');

    // Switch to MySQL
    await dialectSelect.selectOption('mysql');
    await expect(sqlOutput).toHaveValue(/INSERT INTO `users`/);
  });

  test('supports SQL mode switching', async ({ page }) => {
    const sqlOutput = page.locator('#sql-output');

    // Click UPDATE mode
    await page.click('button:has-text("UPDATE")');
    await expect(sqlOutput).toHaveValue(/UPDATE "users" SET/);
  });

  test('Escape key clears input and restores focus to #json-input', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const sqlOutput = page.locator('#sql-output');

    await jsonInput.focus();
    await page.keyboard.press('Escape');

    await expect(jsonInput).toHaveValue('');
    await expect(sqlOutput).toHaveValue('');

    const isFocused = await jsonInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);
  });

  test('C key copies output when unfocused', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Unfocus active elements by clicking heading
    await page.click('h1');

    await page.keyboard.press('c');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('INSERT INTO "users"');
  });
});
