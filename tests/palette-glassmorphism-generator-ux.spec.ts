import { test, expect } from '@playwright/test';

test.describe('Glassmorphism Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/glassmorphism');
  });

  test('should render quick presets and apply them with aria-pressed state', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'Givre Vibrant' });
    await expect(presetBtn).toBeVisible();

    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

    const cssOutput = page.locator('#css-code-output');
    await expect(cssOutput).toContainText('blur(24px)');
    await expect(cssOutput).toContainText('rgba(99, 102, 241');
    await expect(page.getByText('Préréglage "Givre Vibrant" appliqué !')).toBeVisible();
  });

  test('should have explicit ARIA range properties and labels on controls', async ({ page }) => {
    const blurSlider = page.locator('#blur-slider');
    await expect(blurSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(blurSlider).toHaveAttribute('aria-valuemax', '40');
    await expect(blurSlider).toHaveAttribute('aria-valuenow', '10');

    const opacitySlider = page.locator('#opacity-slider');
    await expect(opacitySlider).toHaveAttribute('aria-valuemin', '0');
    await expect(opacitySlider).toHaveAttribute('aria-valuemax', '1');

    const saturationSlider = page.locator('#saturation-slider');
    await expect(saturationSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(saturationSlider).toHaveAttribute('aria-valuemax', '200');

    const borderOpacitySlider = page.locator('#border-opacity-slider');
    await expect(borderOpacitySlider).toHaveAttribute('aria-valuemin', '0');
    await expect(borderOpacitySlider).toHaveAttribute('aria-valuemax', '1');
  });

  test('should reset options and return focus to blur slider when Escape key is pressed', async ({ page }) => {
    const blurSlider = page.locator('#blur-slider');
    await blurSlider.fill('30');

    await page.keyboard.press('Escape');

    await expect(blurSlider).toHaveValue('10');
    await expect(blurSlider).toBeFocused();
    await expect(page.getByText('Paramètres du Glassmorphism réinitialisés !')).toBeVisible();
  });

  test('should copy CSS code when C key is pressed while unfocused', async ({ page }) => {
    const colorHexInput = page.locator('#color-hex');
    await colorHexInput.blur();

    await page.keyboard.press('c');

    await expect(page.getByText('Code CSS copié dans le presse-papiers !')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
