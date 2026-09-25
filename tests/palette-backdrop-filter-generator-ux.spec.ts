import { test, expect } from '@playwright/test';

test.describe('Backdrop Filter Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/backdrop-filter');
  });

  test('should render preview background selector buttons with aria-pressed state', async ({ page }) => {
    const meshBtn = page.getByRole('button', { name: 'Dégradé' });
    const dotsBtn = page.getByRole('button', { name: 'Points' });

    await expect(meshBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(dotsBtn).toHaveAttribute('aria-pressed', 'false');

    await dotsBtn.click();
    await expect(dotsBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(meshBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('should have explicit ARIA range properties on slider controls', async ({ page }) => {
    const blurSlider = page.locator('#filter-Blur');
    await expect(blurSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(blurSlider).toHaveAttribute('aria-valuemax', '20');
    await expect(blurSlider).toHaveAttribute('aria-valuenow', '5');

    const brightnessSlider = page.locator('#filter-Brightness');
    await expect(brightnessSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(brightnessSlider).toHaveAttribute('aria-valuemax', '200');
    await expect(brightnessSlider).toHaveAttribute('aria-valuenow', '100');
  });

  test('should reset filters and return focus to blur slider on Escape key press', async ({ page }) => {
    const blurSlider = page.locator('#filter-Blur');
    await blurSlider.fill('15');
    await expect(blurSlider).toHaveValue('15');

    await page.keyboard.press('Escape');

    await expect(blurSlider).toHaveValue('5');
    await expect(blurSlider).toBeFocused();
    await expect(page.getByText('Paramètres du backdrop filter réinitialisés !')).toBeVisible();
  });

  test('should copy CSS snippet when C key is pressed while unfocused', async ({ page }) => {
    const rgbaInput = page.locator('#bg-color-rgba');
    await rgbaInput.blur();

    await page.keyboard.press('c');

    await expect(page.getByText('Extrait CSS copié dans le presse-papiers !')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
