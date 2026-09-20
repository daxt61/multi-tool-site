import { test, expect } from '@playwright/test';

test.describe('CubicBezierGenerator Palette UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/outil/cubic-bezier');
    await page.waitForSelector('text=Cubic Bezier Generator', { timeout: 10000 });
  });

  test('Preset buttons have aria-pressed attributes and activate correctly', async ({ page }) => {
    const easeInPreset = page.getByRole('button', { name: /^Ease-In$/i, exact: true });
    await expect(easeInPreset).toBeVisible();

    // Click Ease-In preset
    await easeInPreset.click();
    await expect(easeInPreset).toHaveAttribute('aria-pressed', 'true');

    // Check toast
    await expect(page.getByText('Preset "Ease-In" applied!')).toBeVisible();

    // Other presets should be false
    const linearPreset = page.getByRole('button', { name: /^Linear$/i });
    await expect(linearPreset).toHaveAttribute('aria-pressed', 'false');

    // Click Linear preset
    await linearPreset.click();
    await expect(linearPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(easeInPreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('Reset button restores focus to reset button and triggers toast', async ({ page }) => {
    const resetButton = page.getByRole('button', { name: /Reset/i });
    await expect(resetButton).toBeVisible();

    await resetButton.click();

    // Check focus restored
    await expect(resetButton).toBeFocused();

    // Check toast notification
    await expect(page.getByText('Bezier generator reset')).toBeVisible();
  });

  test('Copy button triggers CSS copy and toast notification', async ({ page }) => {
    const copyButton = page.getByRole('button', { name: /Copy/i });
    await expect(copyButton).toBeVisible();

    await copyButton.click();

    // Check toast notification
    await expect(page.getByText('CSS code copied to clipboard!')).toBeVisible();
  });

  test('Animation play/pause button has aria-pressed and toggles state', async ({ page }) => {
    const toggleAnimationBtn = page.getByRole('button', { name: /animation/i });
    await expect(toggleAnimationBtn).toBeVisible();

    // Default is animating (aria-pressed="true")
    await expect(toggleAnimationBtn).toHaveAttribute('aria-pressed', 'true');

    // Click to pause
    await toggleAnimationBtn.click();
    await expect(toggleAnimationBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('Keyboard shortcuts (Escape, C) execute appropriately', async ({ page }) => {
    // Press 'c' to copy CSS
    await page.keyboard.press('c');
    await expect(page.getByText('CSS code copied to clipboard!')).toBeVisible();

    // Press 'Escape' to reset
    await page.keyboard.press('Escape');
    await expect(page.getByText('Bezier generator reset')).toBeVisible();
  });
});
