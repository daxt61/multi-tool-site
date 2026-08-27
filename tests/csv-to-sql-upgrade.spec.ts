import { test, expect } from '@playwright/test';

test.describe('CSV to SQL Converter Upgrades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-to-sql');
    await page.waitForLoadState('networkidle');
  });

  test('loads presets and updates SQL output with CREATE TABLE and INSERT statements', async ({ page }) => {
    // Check initial CSV input and SQL output
    const csvInput = page.locator('#csv-input');
    const sqlOutput = page.locator('#sql-output');

    await expect(csvInput).not.toHaveValue('');
    await expect(sqlOutput).toContainText('CREATE TABLE');
    await expect(sqlOutput).toContainText('INSERT INTO');

    // Click User Directory preset
    const userPresetBtn = page.getByRole('button', { name: 'Annuaire Utilisateurs' });
    await expect(userPresetBtn).toBeVisible();
    await userPresetBtn.click();

    await expect(csvInput).toContainText('user_id,full_name,email');
    await expect(sqlOutput).toContainText('CREATE TABLE "users"');
    await expect(sqlOutput).toContainText('INSERT INTO "users"');
  });

  test('switches dialect and updates identifier quoting', async ({ page }) => {
    const dialectSelect = page.locator('#dialect');
    await expect(dialectSelect).toBeVisible();

    // Switch to MySQL dialect
    await dialectSelect.selectOption('mysql');
    const sqlOutput = page.locator('#sql-output');
    await expect(sqlOutput).toContainText('`products`');

    // Switch to SQL Server dialect
    await dialectSelect.selectOption('mssql');
    await expect(sqlOutput).toContainText('[products]');
  });

  test('toggles CREATE TABLE DDL and batch INSERT mode', async ({ page }) => {
    const sqlOutput = page.locator('#sql-output');

    // Toggle CREATE TABLE off
    const createToggleBtn = page.getByRole('button', { name: 'Inclure CREATE TABLE DDL' });
    await createToggleBtn.click();
    await expect(sqlOutput).not.toContainText('CREATE TABLE');

    // Toggle Batch INSERT on
    const batchToggleBtn = page.getByRole('button', { name: 'INSERT Multi-lignes en Lot' });
    await batchToggleBtn.click();
    await expect(sqlOutput).toContainText('VALUES');
  });

  test('clears input with Escape shortcut and restores focus', async ({ page }) => {
    const csvInput = page.locator('#csv-input');
    await csvInput.focus();
    await page.keyboard.press('Escape');

    await expect(csvInput).toHaveValue('');
    await expect(csvInput).toBeFocused();
  });
});
