import { test, expect } from '@playwright/test';

test.describe('UnitPriceCalculator Palette Micro-UX & Accessibility Suite', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('should load quick presets and display active aria-pressed state', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/unit-price-calculator');
    await page.waitForSelector('#priceA');

    const cerealPreset = page.getByRole('button', { name: 'Cereal Boxes' });
    await expect(cerealPreset).toBeVisible();
    await expect(cerealPreset).toHaveAttribute('aria-pressed', 'false');

    await cerealPreset.click();

    await expect(cerealPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#priceA')).toHaveValue('4.50');
    await expect(page.locator('#qtyA')).toHaveValue('375');
    await expect(page.locator('#unitA')).toHaveValue('g');

    await expect(page.locator('#priceB')).toHaveValue('6.20');
    await expect(page.locator('#qtyB')).toHaveValue('600');

    await expect(page.locator('#priceC')).toHaveValue('8.20');
    await expect(page.locator('#qtyC')).toHaveValue('850');
  });

  test('should clear active preset selection when inputs are manually modified', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/unit-price-calculator');
    await page.waitForSelector('#priceA');

    const cerealPreset = page.getByRole('button', { name: 'Cereal Boxes' });
    await cerealPreset.click();
    await expect(cerealPreset).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#priceA').fill('5.00');
    await expect(cerealPreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('should trigger clear all action and restore focus to #priceA via Escape shortcut', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/unit-price-calculator');
    await page.waitForSelector('#priceA');

    const cerealPreset = page.getByRole('button', { name: 'Cereal Boxes' });
    await cerealPreset.click();

    // Focus an input inside container before pressing Escape so keydown is caught
    await page.locator('#priceA').focus();
    await page.keyboard.press('Escape');

    await expect(page.locator('#priceA')).toHaveValue('');
    await expect(page.locator('#qtyA')).toHaveValue('');
    await expect(page.locator('#priceB')).toHaveValue('');
    await expect(page.locator('#priceC')).toHaveValue('');

    await expect(page.locator('#priceA')).toBeFocused();
  });

  test('should allow copying summary via Copy Summary button and "C" hotkey when unfocused', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/unit-price-calculator');
    await page.waitForSelector('#priceA');

    const cerealPreset = page.getByRole('button', { name: 'Cereal Boxes' });
    await cerealPreset.click();

    const copyBtn = page.getByRole('button', { name: 'Copy Summary' });
    await expect(copyBtn).toBeVisible();

    await copyBtn.click();
    await expect(page.getByText('Comparison summary copied to clipboard').first()).toBeVisible();

    // Test hotkey C when unfocused (blur active input)
    await page.locator('#priceA').blur();
    await page.keyboard.press('c');
    await expect(page.getByText('Comparison summary copied to clipboard').first()).toBeVisible();
  });
});
