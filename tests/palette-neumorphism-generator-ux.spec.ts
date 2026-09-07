import { test, expect } from '@playwright/test';

test.describe('Neumorphism Generator UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/neumorphism-generator');
  });

  test('should display initial ARIA slider attributes and shape toggle states', async ({ page }) => {
    const flatButton = page.getByRole('button', { name: 'Plat' });
    const pressedButton = page.getByRole('button', { name: 'Pressé' });

    await expect(flatButton).toHaveAttribute('aria-pressed', 'true');
    await expect(pressedButton).toHaveAttribute('aria-pressed', 'false');

    const sizeSlider = page.locator('#neo-size');
    await expect(sizeSlider).toHaveAttribute('aria-valuemin', '100');
    await expect(sizeSlider).toHaveAttribute('aria-valuemax', '400');
    await expect(sizeSlider).toHaveAttribute('aria-valuenow', '200');

    const radiusSlider = page.locator('#neo-radius');
    await expect(radiusSlider).toHaveAttribute('aria-valuenow', '50');
  });

  test('should apply quick presets correctly', async ({ page }) => {
    const pressedPresetBtn = page.getByRole('button', { name: /Pressed Button/i });
    await pressedPresetBtn.click();

    const pressedShapeBtn = page.getByRole('button', { name: 'Pressé' });
    await expect(pressedShapeBtn).toHaveAttribute('aria-pressed', 'true');

    const sizeSlider = page.locator('#neo-size');
    await expect(sizeSlider).toHaveAttribute('aria-valuenow', '180');
  });

  test('should reset parameters and focus primary color input on reset button click', async ({ page }) => {
    const pressedPresetBtn = page.getByRole('button', { name: /Pressed Button/i });
    await pressedPresetBtn.click();

    const resetButton = page.getByRole('button', { name: /Réinitialiser/i });
    await resetButton.click();

    const flatShapeBtn = page.getByRole('button', { name: 'Plat' });
    await expect(flatShapeBtn).toHaveAttribute('aria-pressed', 'true');

    const colorTextInput = page.locator('#neo-color-text');
    await expect(colorTextInput).toBeFocused();
  });

  test('should support keyboard shortcuts (Escape reset, C copy)', async ({ page }) => {
    const vibrantPresetBtn = page.getByRole('button', { name: /Vibrant Convex/i });
    await vibrantPresetBtn.click();

    // Ensure focus is not inside an editable field so hotkeys work
    await page.locator('body').click();

    // Press Escape to reset
    await page.keyboard.press('Escape');

    const flatShapeBtn = page.getByRole('button', { name: 'Plat' });
    await expect(flatShapeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#neo-color-text')).toBeFocused();

    // Blur input to test 'c' hotkey
    await page.locator('body').click();
    await page.keyboard.press('c');

    // Verify copy state and toast notification
    await expect(page.getByText('Copié !')).toBeVisible();
    await expect(page.getByText('CSS code copied to clipboard!')).toBeVisible();
  });
});
