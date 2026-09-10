import { test, expect } from '@playwright/test';

test.describe('Soft Shadow Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/soft-shadow');
  });

  test('should render quick presets and apply them when clicked', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'Lumière profonde' });
    await expect(presetBtn).toBeVisible();

    await presetBtn.click();

    const cssOutput = page.locator('#css-code-output');
    await expect(cssOutput).toContainText('rgba(79, 70, 229');
    await expect(page.getByText('Préréglage "Lumière profonde" appliqué !')).toBeVisible();
  });

  test('should have explicit ARIA range properties on sliders', async ({ page }) => {
    const layersSlider = page.locator('#layers-slider');
    await expect(layersSlider).toHaveAttribute('aria-valuemin', '1');
    await expect(layersSlider).toHaveAttribute('aria-valuemax', '10');
    await expect(layersSlider).toHaveAttribute('aria-valuenow', '6');

    const blurSlider = page.locator('#blur-slider');
    await expect(blurSlider).toHaveAttribute('aria-valuemin', '1');
    await expect(blurSlider).toHaveAttribute('aria-valuemax', '250');
    await expect(blurSlider).toHaveAttribute('aria-valuenow', '100');
  });

  test('should reset parameters and focus layers slider when Escape key is pressed', async ({ page }) => {
    const layersInput = page.locator('#layers-slider');
    await layersInput.fill('9');

    await page.keyboard.press('Escape');

    await expect(layersInput).toHaveValue('6');
    await expect(layersInput).toBeFocused();
    await expect(page.getByText("Paramètres d'ombre douce réinitialisés")).toBeVisible();
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
