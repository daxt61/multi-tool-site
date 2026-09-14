import { test, expect } from '@playwright/test';

test.describe('CSS Clamp Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-clamp');
  });

  test('should toggle REM mode with correct aria-pressed attribute', async ({ page }) => {
    const remToggle = page.locator('#use-rem-toggle');
    await expect(remToggle).toHaveAttribute('aria-pressed', 'true');

    await remToggle.click();
    await expect(remToggle).toHaveAttribute('aria-pressed', 'false');

    const cssOutput = page.locator('code[aria-labelledby="result-css-heading"]');
    await expect(cssOutput).toContainText('px');
  });

  test('should have explicit HTML label associations for form inputs', async ({ page }) => {
    await expect(page.locator('label[for="min-size-input"]')).toBeVisible();
    await expect(page.locator('label[for="max-size-input"]')).toBeVisible();
    await expect(page.locator('label[for="min-viewport-input"]')).toBeVisible();
    await expect(page.locator('label[for="max-viewport-input"]')).toBeVisible();
    await expect(page.locator('label[for="base-font-size-input"]')).toBeVisible();
  });

  test('should trigger toast notification and focus primary input on reset', async ({ page }) => {
    const minSizeInput = page.locator('#min-size-input');
    await minSizeInput.fill('24');

    const resetBtn = page.getByRole('button', { name: 'Réinitialiser' });
    await resetBtn.click();

    await expect(minSizeInput).toHaveValue('16');
    await expect(minSizeInput).toBeFocused();
    await expect(page.getByLabel('Notifications alt+T').getByText('Réinitialiser')).toBeVisible();
  });

  test('should trigger copy toast when copy button is clicked', async ({ page }) => {
    const copyBtn = page.getByRole('button', { name: 'Copy CSS clamp value' });
    await copyBtn.click();

    await expect(page.getByText('Copié')).toBeVisible();
  });
});
