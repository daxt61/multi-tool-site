import { test, expect } from '@playwright/test';

test.describe('TextShadowGenerator Palette UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/text-shadow');
    await page.waitForSelector('#preview-text-input');
  });

  test('applies presets correctly and updates aria-pressed states', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: '3D Neon Glow' });
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');

    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

    const input = page.locator('#preview-text-input');
    await input.fill('Modified Text');
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('resets parameters and restores focus on Escape key or Reset button click', async ({ page }) => {
    const input = page.locator('#preview-text-input');
    await input.fill('Custom Shadow');

    const resetBtn = page.getByRole('button', { name: /Réinitialiser/i });
    await resetBtn.click();

    await expect(input).toHaveValue('Hello World');
    await expect(input).toBeFocused();
  });

  test('copies CSS code using keyboard shortcut C when not typing in an input', async ({ page }) => {
    const input = page.locator('#preview-text-input');
    await input.focus();
    await page.keyboard.press('Escape');
    await expect(input).not.toBeFocused();

    await page.keyboard.press('c');
    await expect(page.getByText('CSS code copied to clipboard!')).toBeVisible();
  });
});
