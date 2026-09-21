import { test, expect } from '@playwright/test';

test.describe('CSS Shadow Palette UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-shadow-palette');
  });

  test('should display initial ARIA slider attributes and theme button aria-pressed states', async ({ page }) => {
    const whiteThemeBtn = page.getByRole('button', { name: /Preview background theme: White/i });
    const darkThemeBtn = page.getByRole('button', { name: /Preview background theme: Dark Slate/i });

    await expect(whiteThemeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(darkThemeBtn).toHaveAttribute('aria-pressed', 'false');

    const zoomSlider = page.locator('#shadow-zoom-slider');
    await expect(zoomSlider).toHaveAttribute('aria-valuemin', '0.5');
    await expect(zoomSlider).toHaveAttribute('aria-valuemax', '1.5');
    await expect(zoomSlider).toHaveAttribute('aria-valuenow', '1');
  });

  test('should trigger copy actions with Sonner toasts', async ({ page }) => {
    const copyCssBtn = page.getByRole('button', { name: /Copy CSS for Soft Elevation/i });
    await copyCssBtn.click();

    await expect(page.getByText(/Copied CSS for Soft Elevation!/i)).toBeVisible();

    const copyTwBtn = page.getByRole('button', { name: /Copy Tailwind class for Soft Elevation/i });
    await copyTwBtn.click();

    await expect(page.getByText(/Copied Tailwind for Soft Elevation!/i)).toBeVisible();
  });

  test('should reset parameters and focus primary base color text input on reset button click', async ({ page }) => {
    const darkThemeBtn = page.getByRole('button', { name: /Preview background theme: Dark Slate/i });
    await darkThemeBtn.click();
    await expect(darkThemeBtn).toHaveAttribute('aria-pressed', 'true');

    const resetButton = page.getByRole('button', { name: /Réinitialiser/i });
    await resetButton.click();

    const whiteThemeBtn = page.getByRole('button', { name: /Preview background theme: White/i });
    await expect(whiteThemeBtn).toHaveAttribute('aria-pressed', 'true');

    const colorTextInput = page.locator('#shadow-base-color-text');
    await expect(colorTextInput).toBeFocused();
  });

  test('should support keyboard shortcuts (Escape reset, C copy)', async ({ page }) => {
    const darkThemeBtn = page.getByRole('button', { name: /Preview background theme: Dark Slate/i });
    await darkThemeBtn.click();

    // Ensure focus is on document body
    await page.locator('body').click();

    // Press Escape to reset
    await page.keyboard.press('Escape');

    const whiteThemeBtn = page.getByRole('button', { name: /Preview background theme: White/i });
    await expect(whiteThemeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#shadow-base-color-text')).toBeFocused();

    // Blur input to test 'C' hotkey
    await page.locator('body').click();
    await page.keyboard.press('c');

    await expect(page.getByText(/Copied CSS for Soft Elevation!/i)).toBeVisible();
  });
});
