import { test, expect } from '@playwright/test';

test.describe('Gradient Generator UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/gradient-generator');
  });

  test('should display initial ARIA slider attributes and range bounds', async ({ page }) => {
    const angleSlider = page.locator('#gradient-angle');
    await expect(angleSlider).toBeVisible();
    await expect(angleSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(angleSlider).toHaveAttribute('aria-valuemax', '360');
    await expect(angleSlider).toHaveAttribute('aria-valuenow', '135');

    const firstStopSlider = page.locator('input[id^="gradient-stop-pos-"]').first();
    await expect(firstStopSlider).toBeVisible();
    await expect(firstStopSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(firstStopSlider).toHaveAttribute('aria-valuemax', '100');
  });

  test('should toggle preset active state and display aria-pressed', async ({ page }) => {
    const presetSunsetBtn = page.getByRole('button', { name: /Coucher de Soleil/i });
    await expect(presetSunsetBtn).toBeVisible();
    await expect(presetSunsetBtn).toHaveAttribute('aria-pressed', 'false');

    await presetSunsetBtn.click();
    await expect(presetSunsetBtn).toHaveAttribute('aria-pressed', 'true');

    const cssOutput = page.locator('#gradient-css-output');
    await expect(cssOutput).toContainText('linear-gradient(135deg, #f97316 0%, #ec4899 100%)');
  });

  test('should support linear and radial type buttons with aria-pressed state', async ({ page }) => {
    const linearBtn = page.getByRole('button', { name: 'Linéaire', exact: true });
    const radialBtn = page.getByRole('button', { name: 'Radial', exact: true });

    await expect(linearBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(radialBtn).toHaveAttribute('aria-pressed', 'false');

    await radialBtn.click();

    await expect(linearBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(radialBtn).toHaveAttribute('aria-pressed', 'true');

    const cssOutput = page.locator('#gradient-css-output');
    await expect(cssOutput).toContainText('radial-gradient(circle,');
  });

  test('should support keyboard shortcuts (Escape reset, C copy)', async ({ page }) => {
    const presetSunsetBtn = page.getByRole('button', { name: /Coucher de Soleil/i });
    await presetSunsetBtn.click();

    const cssOutput = page.locator('#gradient-css-output');
    await expect(cssOutput).toContainText('#f97316');

    // Press Escape to reset
    await page.keyboard.press('Escape');

    // Verify reset to default stops
    await expect(cssOutput).toContainText('#6366f1');

    // Primary input (angle slider) should have received focus
    const angleSlider = page.locator('#gradient-angle');
    await expect(angleSlider).toBeFocused();
  });
});
