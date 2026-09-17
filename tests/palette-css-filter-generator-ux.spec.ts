import { test, expect } from '@playwright/test';

test.describe('CSS Filter Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-filter');
  });

  test('should render quick start presets and toggle aria-pressed when applied', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'Vintage Sepia' });
    await expect(presetBtn).toBeVisible();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');

    await presetBtn.click();

    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Preset "Vintage Sepia" applied!')).toBeVisible();

    const cssOutput = page.locator('pre[aria-labelledby="css-filter-code-label"]');
    await expect(cssOutput).toContainText('sepia(70%)');
  });

  test('should have explicit ARIA slider attributes and form label pairings', async ({ page }) => {
    const blurInput = page.locator('#filter-blur');
    await expect(blurInput).toHaveAttribute('aria-valuemin', '0');
    await expect(blurInput).toHaveAttribute('aria-valuemax', '20');
    await expect(blurInput).toHaveAttribute('aria-valuenow', '0');
    await expect(blurInput).toHaveAttribute('aria-label', /Flou|Blur/);

    const label = page.locator('label[for="filter-blur"]');
    await expect(label).toBeVisible();
  });

  test('should reset parameters and focus blur slider when Escape key is pressed', async ({ page }) => {
    const blurInput = page.locator('#filter-blur');
    await blurInput.fill('15');
    await expect(blurInput).toHaveValue('15');

    await page.keyboard.press('Escape');

    await expect(blurInput).toHaveValue('0');
    await expect(blurInput).toBeFocused();
    await expect(page.getByText('CSS filter parameters reset')).toBeVisible();
  });

  test('should copy CSS filter code when C key is pressed while unfocused', async ({ page }) => {
    const blurInput = page.locator('#filter-blur');
    await blurInput.blur();

    await page.keyboard.press('c');

    await expect(page.getByText('CSS filter code copied to clipboard!')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
