import { test, expect } from '@playwright/test';

test.describe('CSS Border Radius Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-border-radius');
  });

  test('should render quick presets and apply them when clicked', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'Pill / Rounded' });
    await expect(presetBtn).toBeVisible();

    await presetBtn.click();

    const cssOutput = page.locator('pre[aria-labelledby="border-radius-css-label"]');
    await expect(cssOutput).toContainText('border-radius: 50px;');
    await expect(page.getByText('Preset "Pill / Rounded" applied!')).toBeVisible();
  });

  test('should toggle link state with correct aria-pressed attribute', async ({ page }) => {
    const linkBtn = page.getByRole('button', { name: /Liés|Indépendants/ });
    await expect(linkBtn).toHaveAttribute('aria-pressed', 'true');

    await linkBtn.click();
    await expect(linkBtn).toHaveAttribute('aria-pressed', 'false');

    // Independent corner sliders should now be visible
    await expect(page.locator('#tr')).toBeVisible();
    await expect(page.locator('#br')).toBeVisible();
    await expect(page.locator('#bl')).toBeVisible();
  });

  test('should have explicit ARIA slider attributes on inputs', async ({ page }) => {
    const tlInput = page.locator('#tl');
    await expect(tlInput).toHaveAttribute('aria-valuemin', '0');
    await expect(tlInput).toHaveAttribute('aria-valuemax', '200');
    await expect(tlInput).toHaveAttribute('aria-valuenow', '20');
    await expect(tlInput).toHaveAttribute('aria-label', 'Rayon haut-gauche en pixels');
  });

  test('should reset parameters and focus top-left slider when Escape key is pressed', async ({ page }) => {
    const tlInput = page.locator('#tl');
    await tlInput.fill('80');

    await page.keyboard.press('Escape');

    await expect(tlInput).toHaveValue('20');
    await expect(tlInput).toBeFocused();
    await expect(page.getByText('Border radius parameters reset')).toBeVisible();
  });

  test('should copy CSS code when C key is pressed while unfocused', async ({ page }) => {
    const tlInput = page.locator('#tl');
    await tlInput.blur();

    await page.keyboard.press('c');

    await expect(page.getByText('CSS code copied to clipboard!')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
