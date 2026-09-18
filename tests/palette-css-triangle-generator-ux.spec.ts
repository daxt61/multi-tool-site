import { test, expect } from '@playwright/test';

test.describe('CSSTriangleGenerator Palette UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#css-triangle-generator');
    await page.waitForSelector('text=CSS Triangle Generator', { timeout: 10000 });
  });

  test('Preset buttons have correct aria-pressed attributes when selected', async ({ page }) => {
    const tooltipPreset = page.getByRole('button', { name: /Tooltip Arrow/i });
    await expect(tooltipPreset).toBeVisible();

    // Apply Tooltip Arrow preset
    await tooltipPreset.click();
    await expect(tooltipPreset).toHaveAttribute('aria-pressed', 'true');

    // Other presets should be aria-pressed=false
    const dropdownPreset = page.getByRole('button', { name: /Dropdown Caret/i });
    await expect(dropdownPreset).toHaveAttribute('aria-pressed', 'false');

    // Click Dropdown Caret preset
    await dropdownPreset.click();
    await expect(dropdownPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(tooltipPreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('Form label pairings and range slider ARIA attributes exist', async ({ page }) => {
    const widthSlider = page.locator('#width');
    await expect(widthSlider).toBeVisible();
    await expect(widthSlider).toHaveAttribute('aria-valuemin', '10');
    await expect(widthSlider).toHaveAttribute('aria-valuemax', '300');

    const heightSlider = page.locator('#height');
    await expect(heightSlider).toBeVisible();
    await expect(heightSlider).toHaveAttribute('aria-valuemin', '10');
    await expect(heightSlider).toHaveAttribute('aria-valuemax', '300');

    const colorPicker = page.locator('#color-picker');
    await expect(colorPicker).toBeVisible();
    await expect(colorPicker).toHaveAttribute('aria-label', 'Sélecteur de couleur');

    const colorHex = page.locator('#color-hex');
    await expect(colorHex).toBeVisible();
    await expect(colorHex).toHaveAttribute('aria-label', 'Code couleur hexadécimal');
  });

  test('Reset button restores focus to #width input and triggers toast', async ({ page }) => {
    const resetButton = page.getByRole('button', { name: /Réinitialiser/i });
    await resetButton.click();

    // Check focus restored to width slider
    const widthSlider = page.locator('#width');
    await expect(widthSlider).toBeFocused();

    // Check Sonner toast appeared
    await expect(page.getByText('Triangle generator reset')).toBeVisible();
  });
});
