import { test, expect } from '@playwright/test';

test.describe('ColorPaletteGenerator Palette UX & Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('http://localhost:5173/fr/outil/color-palette');
    await page.waitForSelector('#baseColor-hex');
  });

  test('applies presets correctly and updates aria-pressed states', async ({ page }) => {
    const emeraldPreset = page.getByRole('button', { name: 'Émeraude' });
    await expect(emeraldPreset).toHaveAttribute('aria-pressed', 'false');

    await emeraldPreset.click();

    await expect(emeraldPreset).toHaveAttribute('aria-pressed', 'true');
    const hexInput = page.locator('#baseColor-hex');
    await expect(hexInput).toHaveValue('#10B981');
  });

  test('resets parameters and restores focus on Escape key or Reset button click', async ({ page }) => {
    const emeraldPreset = page.getByRole('button', { name: 'Émeraude' });
    await emeraldPreset.click();

    const hexInput = page.locator('#baseColor-hex');
    await expect(hexInput).toHaveValue('#10B981');

    await page.keyboard.press('Escape');

    await expect(hexInput).toHaveValue('#6366F1');
    await expect(hexInput).toBeFocused();
  });

  test('copies base color using keyboard shortcut C when not typing in an input', async ({ page }) => {
    const copyBtn = page.getByTitle('Copier (#6366F1)');
    await expect(copyBtn).toBeVisible();

    await page.keyboard.press('c');

    const toast = page.getByText('Copié: #6366F1');
    await expect(toast).toBeVisible();
  });

  test('generates random color using keyboard shortcut R', async ({ page }) => {
    const hexInput = page.locator('#baseColor-hex');
    const initialHex = await hexInput.inputValue();

    await page.keyboard.press('r');

    const newHex = await hexInput.inputValue();
    expect(newHex).not.toBe(initialHex);
  });
});
