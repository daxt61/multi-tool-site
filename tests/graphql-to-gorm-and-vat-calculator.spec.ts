import { test, expect } from '@playwright/test';

test.describe('GraphQLToGorm and VATCalculator Palette Micro-UX', () => {
  test('GraphQLToGorm converts GraphQL SDL schema to Go GORM struct models', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-gorm');

    const inputArea = page.locator('#graphql-gorm-input');
    const outputArea = page.locator('#gorm-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Verify Quick Start Presets
    const ecommerceBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(ecommerceBtn).toBeVisible();
    await ecommerceBtn.click();

    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(inputArea).toHaveValue(/type Category/);
    await expect(outputArea).toHaveValue(/type Category struct/);
    await expect(outputArea).toHaveValue(/gorm\.Model/);
    await expect(outputArea).toHaveValue(/func \(Category\) TableName\(\) string/);

    // Verify Dialect options
    const dialectSelect = page.locator('#dialect');
    await dialectSelect.selectOption('mysql');
    await expect(outputArea).toHaveValue(/type:bigint/);

    // Verify clear keyboard shortcut Escape
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });

  test('VATCalculator micro-UX, presets, and hotkeys', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/vat-calculator');

    const amountInput = page.locator('#amount');
    await expect(amountInput).toBeVisible();

    // Test Quick Start Presets
    const foodPreset = page.getByRole('button', { name: 'Catering / Food' });
    await expect(foodPreset).toBeVisible();
    await foodPreset.click();

    await expect(foodPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(amountInput).toHaveValue('45.00');

    // Clear via Escape key
    await amountInput.focus();
    await page.keyboard.press('Escape');
    await expect(amountInput).toHaveValue('');
  });
});
