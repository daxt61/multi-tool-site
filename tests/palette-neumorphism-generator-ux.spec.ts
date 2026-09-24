import { test, expect } from '@playwright/test';

test.describe('NeumorphismGenerator Palette Micro-UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#neumorphism-generator');
  });

  test('applies presets with active aria-pressed state', async ({ page }) => {
    const softCardBtn = page.getByRole('button', { name: /Soft Card/i });
    await expect(softCardBtn).toBeVisible();

    await softCardBtn.click();
    await expect(softCardBtn).toHaveAttribute('aria-pressed', 'true');

    const cssCode = page.locator('#neumorphism-css-code');
    await expect(cssCode).toContainText('box-shadow:');
  });

  test('sliders have explicit ARIA accessibility attributes', async ({ page }) => {
    const sizeSlider = page.locator('#neo-size');
    await expect(sizeSlider).toHaveAttribute('aria-valuemin', '100');
    await expect(sizeSlider).toHaveAttribute('aria-valuemax', '400');
    await expect(sizeSlider).toHaveAttribute('aria-valuenow', '200');

    const blurSlider = page.locator('#neo-blur');
    await expect(blurSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(blurSlider).toHaveAttribute('aria-valuemax', '100');
    await expect(blurSlider).toHaveAttribute('aria-valuenow', '40');
  });

  test('resets parameters with reset button and restores focus', async ({ page }) => {
    const sizeSlider = page.locator('#neo-size');
    await sizeSlider.fill('350');

    const resetBtn = page.getByRole('button', { name: /Réinitialiser/i });
    await resetBtn.click();

    await expect(sizeSlider).toHaveAttribute('aria-valuenow', '200');
    const colorText = page.locator('#neo-color-text');
    await expect(colorText).toBeFocused();
  });
});
