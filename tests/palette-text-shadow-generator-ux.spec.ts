import { test, expect } from '@playwright/test';

test.describe('Text Shadow Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/text-shadow');
  });

  test('should render quick presets and apply them when clicked', async ({ page }) => {
    const presetButton = page.getByRole('button', { name: /3D Neon Glow/i });
    await expect(presetButton).toBeVisible();
    await presetButton.click();

    // CSS output should be updated with neon glow shadow layer values
    const cssPre = page.locator('pre');
    await expect(cssPre).toContainText('text-shadow:');
    await expect(cssPre).toContainText('rgba(99, 102, 241, 1)');
  });

  test('should have explicit ARIA slider attributes on inputs', async ({ page }) => {
    const firstXRange = page.getByLabel(/Shadow #1 X offset/i);
    await expect(firstXRange).toBeVisible();
    await expect(firstXRange).toHaveAttribute('aria-valuemin', '-50');
    await expect(firstXRange).toHaveAttribute('aria-valuemax', '50');
    await expect(firstXRange).toHaveAttribute('aria-valuenow', '2');
  });

  test('should reset parameters and focus preview text input when Escape key is pressed', async ({ page }) => {
    const previewInput = page.locator('#preview-text-input');
    await previewInput.fill('Custom Shadow Test');

    // Click on quick preset to change state
    await page.getByRole('button', { name: /3D Neon Glow/i }).click();

    // Blur inputs and press Escape
    await page.keyboard.press('Escape');

    // Preview text input should be reset and focused
    await expect(previewInput).toHaveValue('Hello World');
    await expect(previewInput).toBeFocused();
  });

  test('should copy CSS code when C key is pressed while unfocused', async ({ page }) => {
    // Ensure no editable field is focused
    await page.locator('body').click();
    await page.keyboard.press('c');

    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('CSS code copied to clipboard!');
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    const escKbd = page.locator('button', { hasText: 'Réinitialiser' }).locator('kbd');
    await expect(escKbd).toBeVisible();
    await expect(escKbd).toHaveText('Esc');

    const copyKbd = page.locator('button', { hasText: 'Copier' }).locator('kbd');
    await expect(copyKbd).toBeVisible();
    await expect(copyKbd).toHaveText('C');
  });
});
