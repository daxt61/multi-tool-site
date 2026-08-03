import { test, expect } from '@playwright/test';

test.describe('Tip Calculator Keyboard Shortcuts and UX', () => {
  test('should load correct translations for French and English', async ({ page }) => {
    // 1. French Translation Mode
    await page.goto('http://localhost:5173/fr/outil/tip-calculator');
    const frenchLabel = page.locator('label[for="bill-amount"]');
    await expect(frenchLabel).toContainText("Montant de l'addition");

    // 2. English Translation Mode
    await page.goto('http://localhost:5173/en/outil/tip-calculator');
    const englishLabel = page.locator('label[for="bill-amount"]');
    await expect(englishLabel).toContainText("Bill Amount");
  });

  test('should clear inputs and focus bill amount when Escape is pressed', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/tip-calculator');
    const billInput = page.locator('#bill-amount');
    const peopleInput = page.locator('#people-count');

    await billInput.fill('120');
    await peopleInput.fill('3');

    await billInput.focus();
    await page.keyboard.press('Escape');

    await expect(billInput).toHaveValue('');
    await expect(peopleInput).toHaveValue('1'); // Reset to default "1"
    await expect(billInput).toBeFocused();
  });

  test('should copy results and show toast when C is pressed', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/tip-calculator');
    const billInput = page.locator('#bill-amount');
    await billInput.fill('150');

    // Blur input so global shortcut 'c' works
    await billInput.blur();

    // Press C
    await page.keyboard.press('c');

    // Verify copying state changed and toast showed up
    const copyBtn = page.locator('button[aria-label="Copy summary"]');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn.locator('svg')).toHaveClass(/lucide-check/);

    // Verify Toast is shown
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();
    await expect(toast.first()).toContainText('Summary copied');
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/tip-calculator');
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeVisible();
  });
});
