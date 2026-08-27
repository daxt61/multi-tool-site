import { test, expect } from '@playwright/test';

test.describe('SQL to Prisma Schema Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-prisma');
  });

  test('renders labels, textareas, provider selector, and options', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL en Schéma Prisma');

    await expect(page.locator('label[for="sql-prisma-provider"]')).toBeVisible();
    await expect(page.locator('label[for="sql-prisma-input"]')).toBeVisible();
    await expect(page.locator('label[for="prisma-schema-output"]')).toBeVisible();

    await expect(page.locator('#sql-prisma-input')).toBeVisible();
    await expect(page.locator('#prisma-schema-output')).toBeVisible();
  });

  test('loads E-Commerce preset and generates Prisma models with relations and maps', async ({ page }) => {
    // Click E-Commerce preset button
    const presetBtn = page.getByRole('button', { name: /Base de données E-Commerce|E-Commerce Database/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Check output contains expected Prisma schema models
    const output = page.locator('#prisma-schema-output');
    await expect(output).toHaveValue(/datasource db \{[\s\S]*provider = "postgresql"/);
    await expect(output).toHaveValue(/model Categories \{[\s\S]*id\s+Int\s+@id\s+@default\(autoincrement\(\)\)/);
    await expect(output).toHaveValue(/model Products \{[\s\S]*categories\s+Categories\s+@relation/);
  });

  test('changes provider to mysql and toggles option checkboxes', async ({ page }) => {
    // Load Blog preset
    const blogPresetBtn = page.getByRole('button', { name: /Blog & Commentaires|Blog & Comments/i });
    await blogPresetBtn.click();

    // Change provider to mysql
    const providerSelect = page.locator('#sql-prisma-provider');
    await providerSelect.selectOption('mysql');

    const output = page.locator('#prisma-schema-output');
    await expect(output).toHaveValue(/provider = "mysql"/);

    // Toggle add timestamps
    const timestampsCheckbox = page.locator('#add-timestamps');
    await timestampsCheckbox.check();

    await expect(output).toHaveValue(/updatedAt\s+DateTime\s+@updatedAt/);
  });

  test('clears input with Escape key and restores focus', async ({ page }) => {
    // Click User Auth preset
    const userAuthPreset = page.getByRole('button', { name: /Authentification & Rôles|User Auth & Roles/i });
    await userAuthPreset.click();

    const input = page.locator('#sql-prisma-input');
    await expect(input).not.toHaveValue('');

    // Unfocus textareas by clicking outside
    await page.locator('h1').click();

    // Press Escape key
    await page.keyboard.press('Escape');

    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('copies output when clicking Copy button', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Load E-Commerce preset
    const presetBtn = page.getByRole('button', { name: /Base de données E-Commerce|E-Commerce Database/i });
    await presetBtn.click();

    // Click Copy button
    const copyBtn = page.getByRole('button', { name: /Copier|Copy/i }).first();
    await copyBtn.click();

    // Toast notification should appear
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  });
});
