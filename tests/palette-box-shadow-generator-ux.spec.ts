import { test, expect } from '@playwright/test';

test.describe('Box Shadow Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/box-shadow');
  });

  test('should render quick presets and apply them when clicked', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'Vibrant Glow' });
    await expect(presetBtn).toBeVisible();

    await presetBtn.click();

    const cssOutput = page.locator('#css-code-output');
    await expect(cssOutput).toContainText('box-shadow: 0px 0px 30px 5px rgba(99, 102, 241, 0.5);');
    await expect(page.getByText('Preset "Vibrant Glow" applied!')).toBeVisible();
  });

  test('should toggle inset mode with correct aria-pressed attribute', async ({ page }) => {
    const insetBtn = page.getByRole('button', { name: 'Ombre intérieure (Inset)' });
    await expect(insetBtn).toHaveAttribute('aria-pressed', 'false');

    await insetBtn.click();
    await expect(insetBtn).toHaveAttribute('aria-pressed', 'true');

    const cssOutput = page.locator('#css-code-output');
    await expect(cssOutput).toContainText('inset');
  });

  test('should reset parameters and focus horizontal offset slider when Escape key is pressed', async ({ page }) => {
    const hOffsetInput = page.locator('#h-offset');
    await hOffsetInput.fill('45');

    await page.keyboard.press('Escape');

    await expect(hOffsetInput).toHaveValue('10');
    await expect(hOffsetInput).toBeFocused();
    await expect(page.getByText('Box shadow parameters reset')).toBeVisible();
  });

  test('should copy CSS code when C key is pressed while unfocused', async ({ page }) => {
    const hOffsetInput = page.locator('#h-offset');
    await hOffsetInput.blur();

    await page.keyboard.press('c');

    await expect(page.getByText('CSS code copied to clipboard!')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
