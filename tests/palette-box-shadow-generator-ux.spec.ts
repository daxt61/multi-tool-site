import { test, expect } from '@playwright/test';

test.describe('BoxShadowGenerator Palette UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/box-shadow');
    await page.waitForSelector('#h-offset');
  });

  test('applies presets correctly and updates ARIA states', async ({ page }) => {
    const sharpBorderPreset = page.getByRole('button', { name: /Sharp Border|Bordure Nette/i });
    await expect(sharpBorderPreset).toHaveAttribute('aria-pressed', 'false');

    await sharpBorderPreset.click();

    await expect(sharpBorderPreset).toHaveAttribute('aria-pressed', 'true');

    const hOffsetInput = page.locator('#h-offset');
    await expect(hOffsetInput).toHaveAttribute('aria-valuenow', '6');

    const cssOutput = page.locator('#css-code-output');
    await expect(cssOutput).toContainText('box-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1)');
  });

  test('toggles inset shadow and updates aria-pressed', async ({ page }) => {
    const insetButton = page.getByRole('button', { name: /Inset Shadow|Ombre Intérieure/i });
    await expect(insetButton).toHaveAttribute('aria-pressed', 'false');

    await insetButton.click();
    await expect(insetButton).toHaveAttribute('aria-pressed', 'true');

    const cssOutput = page.locator('#css-code-output');
    await expect(cssOutput).toContainText('inset');
  });

  test('resets parameters and restores focus on Escape key or Reset button click', async ({ page }) => {
    const sharpBorderPreset = page.getByRole('button', { name: /Sharp Border|Bordure Nette/i });
    await sharpBorderPreset.click();

    const resetButton = page.getByRole('button', { name: /Reset|Réinitialiser/i });
    await resetButton.click();

    const hOffsetInput = page.locator('#h-offset');
    await expect(hOffsetInput).toHaveAttribute('aria-valuenow', '10');
    await expect(hOffsetInput).toBeFocused();
  });

  test('copies CSS code using keyboard shortcut C when not typing in an input', async ({ page }) => {
    await page.keyboard.press('c');
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/copié|copied/i);
  });
});
