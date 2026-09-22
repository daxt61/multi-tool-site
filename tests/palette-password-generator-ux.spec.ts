import { test, expect } from '@playwright/test';

test.describe('Password Generator UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/password-generator');
  });

  test('should display initial ARIA slider attributes and range bounds', async ({ page }) => {
    const quantitySlider = page.locator('#password-quantity');
    await expect(quantitySlider).toHaveAttribute('aria-valuemin', '1');
    await expect(quantitySlider).toHaveAttribute('aria-valuemax', '50');
    await expect(quantitySlider).toHaveAttribute('aria-valuenow', '1');

    const lengthSlider = page.locator('#password-length');
    await expect(lengthSlider).toHaveAttribute('aria-valuemin', '4');
    await expect(lengthSlider).toHaveAttribute('aria-valuemax', '128');
    await expect(lengthSlider).toHaveAttribute('aria-valuenow', '16');
  });

  test('should clear state and restore focus to primary input on clear button click', async ({ page }) => {
    const clearButton = page.getByRole('button', { name: /Effacer/i });
    await clearButton.click();

    // Verify focus is restored to quantity slider
    const quantitySlider = page.locator('#password-quantity');
    await expect(quantitySlider).toBeFocused();
  });

  test('should support keyboard shortcuts (Escape clear, R regenerate when body focused)', async ({ page }) => {
    // Click page to ensure window focus
    await page.locator('body').click();

    // Press Escape to clear passwords and focus slider
    await page.keyboard.press('Escape');
    const quantitySlider = page.locator('#password-quantity');
    await expect(quantitySlider).toBeFocused();

    // Blur input to test body shortcut
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    // Press R to regenerate password
    await page.keyboard.press('r');
    const pwdInput = page.locator('input[aria-label="Mot de passe"]').first();
    await expect(pwdInput).not.toHaveValue('');
  });
});
