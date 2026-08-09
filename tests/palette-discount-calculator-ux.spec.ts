import { test, expect } from '@playwright/test';

test.describe('Discount Calculator Keyboard Shortcuts and UX', () => {
  test.beforeEach(async ({ context }) => {
    // Grant clipboard permissions to avoid headless browser permission blocks
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test('should load correct translations for French and English', async ({ page }) => {
    // 1. French Translation Mode
    await page.goto('http://localhost:5173/fr/outil/discount-calculator');
    const frenchLabel = page.locator('label[for="price"]');
    await expect(frenchLabel).toContainText("Prix original");

    // 2. English Translation Mode
    await page.goto('http://localhost:5173/en/outil/discount-calculator');
    const englishLabel = page.locator('label[for="price"]');
    await expect(englishLabel).toContainText("Original Price");
  });

  test('should clear inputs and focus price amount when Escape is pressed', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/discount-calculator');
    const priceInput = page.locator('#price');
    const discount1Input = page.locator('#discount1');
    const discount2Input = page.locator('#discount2');

    await priceInput.fill('100');
    await discount1Input.fill('20');
    await discount2Input.fill('10');

    await priceInput.focus();
    await page.keyboard.press('Escape');

    await expect(priceInput).toHaveValue('');
    await expect(discount1Input).toHaveValue('');
    await expect(discount2Input).toHaveValue('');
    await expect(priceInput).toBeFocused();
  });

  test('should copy results and show toast when C is pressed', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/discount-calculator');
    const priceInput = page.locator('#price');
    const discount1Input = page.locator('#discount1');

    await priceInput.fill('100');
    await discount1Input.fill('20');

    // Focus outside of the input areas (like the page title) to allow global shortcuts
    await page.locator('h3').first().click();

    // Press C
    await page.keyboard.press('c');

    // Verify Toast is shown
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();
    await expect(toast.first()).toContainText('Summary results copied');
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/discount-calculator');
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
  });
});
