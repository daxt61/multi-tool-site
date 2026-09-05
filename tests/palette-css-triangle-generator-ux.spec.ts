import { test, expect } from '@playwright/test';

test.describe('CSS Triangle Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-triangle');
  });

  test('should render quick presets and apply them when clicked', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: /Tooltip Arrow/i });
    await expect(presetBtn).toBeVisible();

    await presetBtn.click();

    const cssOutput = page.locator('pre[aria-labelledby="css-triangle-code-label"]');
    await expect(cssOutput).toContainText('border-bottom: 10px solid #1e293b;');
    await expect(page.getByText('Preset "Tooltip Arrow" applied!')).toBeVisible();
  });

  test('should have explicit ARIA slider attributes on range inputs', async ({ page }) => {
    const widthInput = page.locator('#width');
    await expect(widthInput).toHaveAttribute('aria-valuemin', '10');
    await expect(widthInput).toHaveAttribute('aria-valuemax', '300');
    await expect(widthInput).toHaveAttribute('aria-valuenow', '100');
    await expect(widthInput).toHaveAttribute('aria-label', 'Largeur du triangle en pixels');
  });

  test('should reset parameters and focus width slider when Escape key is pressed', async ({ page }) => {
    const widthInput = page.locator('#width');
    await widthInput.fill('250');

    await page.keyboard.press('Escape');

    await expect(widthInput).toHaveValue('100');
    await expect(widthInput).toBeFocused();
    await expect(page.getByText('Triangle generator reset')).toBeVisible();
  });

  test('should copy CSS code when C key is pressed while unfocused', async ({ page }) => {
    const widthInput = page.locator('#width');
    await widthInput.blur();

    await page.keyboard.press('c');

    await expect(page.getByText('CSS code copied to clipboard!')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
