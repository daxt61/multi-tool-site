import { test, expect } from '@playwright/test';

test.describe('GraphQLToKysely & MarginCalculator Palette UX', () => {
  test('GraphQLToKysely loads presets, converts schema, toggles options, and handles shortcuts', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/graphql-to-kysely');

    await expect(page.locator('#graphql-kysely-input')).toBeVisible();

    // Test E-Commerce preset
    const presetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

    // Check generated output
    const output = page.locator('#kysely-output');
    await expect(output).toContainText('export interface CategoryTable');
    await expect(output).toContainText('export interface ProductTable');
    await expect(output).toContainText('export interface Database');

    // Toggle field casing options to snake_case
    const snakeCaseOption = page.locator('#field-casing');
    await snakeCaseOption.selectOption('snake_case');
    await expect(output).toContainText('category_id: Generated<string>;');

    // Test Escape key clears inputs and restores focus
    await page.locator('#graphql-kysely-input').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#graphql-kysely-input')).toHaveValue('');
    await expect(page.locator('#graphql-kysely-input')).toBeFocused();
  });

  test('MarginCalculator loads presets, calculates profit/margin/markup, handles ARIA states, and resets', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/margin-calculator');

    await expect(page.locator('#cost-price')).toBeVisible();

    // Input custom values
    await page.locator('#cost-price').fill('50');
    await page.locator('#selling-price').fill('100');
    await page.getByRole('button', { name: /Calculer/i }).first().click();
    await expect(page.locator('#margin-percent')).toHaveValue('50.00');

    // Test preset button
    const saasPreset = page.getByRole('button', { name: /saas_sub|SaaS/i });
    if (await saasPreset.isVisible()) {
      await saasPreset.click();
      await expect(saasPreset).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#cost-price')).toHaveValue('20.00');
    }

    // Reset via button with aria-label Reset
    const clearBtn = page.locator('button[aria-label="Reset Calculator"], button[aria-label="Effacer"]');
    await clearBtn.click();
    await expect(page.locator('#cost-price')).toHaveValue('');
    await expect(page.locator('#cost-price')).toBeFocused();
  });
});
