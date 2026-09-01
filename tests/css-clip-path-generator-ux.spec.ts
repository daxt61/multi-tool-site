import { test, expect } from '@playwright/test';

test.describe('CSS Clip Path Generator UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-clippath');
  });

  test('should announce shape type toggle aria-pressed states and switch shapes', async ({ page }) => {
    const polygonButton = page.getByRole('button', { name: 'Polygone' });
    const circleButton = page.getByRole('button', { name: 'Cercle' }).last();

    await expect(polygonButton).toHaveAttribute('aria-pressed', 'true');
    await expect(circleButton).toHaveAttribute('aria-pressed', 'false');

    await circleButton.click();
    await expect(circleButton).toHaveAttribute('aria-pressed', 'true');
    await expect(polygonButton).toHaveAttribute('aria-pressed', 'false');

    // Check ARIA properties on Circle sliders
    const radiusSlider = page.locator('#circle-r-range');
    await expect(radiusSlider).toHaveAttribute('aria-valuemin', '1');
    await expect(radiusSlider).toHaveAttribute('aria-valuemax', '100');
    await expect(radiusSlider).toHaveAttribute('aria-valuenow', '50');
  });

  test('should reset configuration and restore focus to reset button', async ({ page }) => {
    const circleButton = page.getByRole('button', { name: 'Cercle' }).last();
    await circleButton.click();

    const resetButton = page.getByRole('button', { name: /Réinitialiser|Reset/i });
    await resetButton.click();

    // Reset restores to initial polygon preset shape
    const polygonButton = page.getByRole('button', { name: 'Polygone' });
    await expect(polygonButton).toHaveAttribute('aria-pressed', 'true');
    await expect(resetButton).toBeFocused();
  });

  test('should handle keyboard shortcuts for resetting and copying CSS', async ({ page }) => {
    const circleButton = page.getByRole('button', { name: 'Cercle' }).last();
    await circleButton.click();

    // Press Escape to reset
    await page.keyboard.press('Escape');

    const polygonButton = page.getByRole('button', { name: 'Polygone' });
    await expect(polygonButton).toHaveAttribute('aria-pressed', 'true');

    // Press C to copy CSS
    await page.keyboard.press('c');
    const cssTextarea = page.getByLabel('Generated CSS code');
    const cssContent = await cssTextarea.inputValue();
    expect(cssContent).toContain('clip-path: polygon');
  });
});
