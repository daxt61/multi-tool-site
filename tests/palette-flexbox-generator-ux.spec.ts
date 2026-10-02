import { test, expect } from '@playwright/test';

test.describe('Flexbox Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/flexbox-generator');
  });

  test('should render quick presets and apply them with aria-pressed state', async ({ page }) => {
    const presetHero = page.getByRole('button', { name: /Bannière Hero/i });
    const presetCentered = page.getByRole('button', { name: /Contenu Centré/i });

    await expect(presetHero).toBeVisible();
    await expect(presetCentered).toBeVisible();

    // Select Hero preset
    await presetHero.click();
    await expect(presetHero).toHaveAttribute('aria-pressed', 'true');

    // Gap slider should reflect 20px
    const gapSlider = page.locator('#flex-gap');
    await expect(gapSlider).toHaveValue('20');

    // Select Centered preset
    await presetCentered.click();
    await expect(presetCentered).toHaveAttribute('aria-pressed', 'true');
    await expect(presetHero).toHaveAttribute('aria-pressed', 'false');
    await expect(gapSlider).toHaveValue('16');
  });

  test('should have explicit ARIA range properties and form labels on controls', async ({ page }) => {
    const gapSlider = page.locator('#flex-gap');
    await expect(gapSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(gapSlider).toHaveAttribute('aria-valuemax', '100');
    await expect(gapSlider).toHaveAttribute('aria-valuenow', '10');

    const justifyContentSelect = page.locator('#flex-justify-content');
    await expect(justifyContentSelect).toBeVisible();

    const alignItemsSelect = page.locator('#flex-align-items');
    await expect(alignItemsSelect).toBeVisible();

    const alignContentSelect = page.locator('#flex-align-content');
    await expect(alignContentSelect).toBeVisible();
  });

  test('should reset configuration and return focus to gap slider when Escape is pressed', async ({ page }) => {
    const gapSlider = page.locator('#flex-gap');
    await gapSlider.fill('50');
    await expect(gapSlider).toHaveValue('50');

    // Press Escape
    await page.keyboard.press('Escape');

    // Values should reset to default gap (10)
    await expect(gapSlider).toHaveValue('10');
    await expect(gapSlider).toBeFocused();
  });

  test('should copy CSS code when C key is pressed while unfocused', async ({ page }) => {
    // Focus outside inputs
    await page.locator('body').click();

    // Press 'c'
    await page.keyboard.press('c');

    // Verify toast notification appears
    await expect(page.getByText('Code CSS copié dans le presse-papier !')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    const escBadge = page.locator('button', { hasText: 'Réinitialiser' }).locator('kbd');
    await expect(escBadge).toBeVisible();
    await expect(escBadge).toHaveText('Esc');

    const copyBadge = page.locator('button[aria-label="Copier"]').locator('kbd');
    await expect(copyBadge).toBeVisible();
    await expect(copyBadge).toHaveText('C');
  });
});
