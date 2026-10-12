import { test, expect } from '@playwright/test';

test.describe('FuelCostCalculator Palette UX & Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('http://localhost:5173/fr/outil/fuel-cost');
    await page.waitForSelector('#distance');
  });

  test('applies presets correctly and updates aria-pressed states', async ({ page }) => {
    const commutePreset = page.locator('button', { hasText: 'Trajet Domicile-Travail' });
    const weekendPreset = page.locator('button', { hasText: 'Escapade de Weekend' });

    await expect(commutePreset).toHaveAttribute('aria-pressed', 'false');

    await commutePreset.click();

    await expect(commutePreset).toHaveAttribute('aria-pressed', 'true');
    await expect(weekendPreset).toHaveAttribute('aria-pressed', 'false');

    await expect(page.locator('#distance')).toHaveValue('30');
    await expect(page.locator('#consumption')).toHaveValue('6.0');
    await expect(page.locator('#fuelPrice')).toHaveValue('1.85');
    await expect(page.locator('#people')).toHaveValue('1');
  });

  test('resets parameters and restores focus on Escape key or Reset button click', async ({ page }) => {
    const distanceInput = page.locator('#distance');
    const commutePreset = page.locator('button', { hasText: 'Trajet Domicile-Travail' });

    await commutePreset.click();
    await expect(distanceInput).toHaveValue('30');

    await distanceInput.focus();
    await page.keyboard.press('Escape');

    await expect(distanceInput).toHaveValue('');
    await expect(distanceInput).toBeFocused();
    await expect(commutePreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('copies summary using keyboard shortcut C when not typing in an input', async ({ page }) => {
    const distanceInput = page.locator('#distance');
    const commutePreset = page.locator('button', { hasText: 'Trajet Domicile-Travail' });

    await commutePreset.click();
    await distanceInput.blur();

    await page.keyboard.press('c');

    const copyButton = page.locator('button[aria-label="Copier (C)"]');
    await expect(copyButton).toBeVisible();
  });

  test('displays visual Kbd shortcut badges and input label associations', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();

    await expect(page.locator('label[for="distance"]')).toBeVisible();
    await expect(page.locator('label[for="consumption"]')).toBeVisible();
    await expect(page.locator('label[for="fuelPrice"]')).toBeVisible();
    await expect(page.locator('label[for="people"]')).toBeVisible();
  });
});
