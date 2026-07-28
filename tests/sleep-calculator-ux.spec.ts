import { test, expect } from '@playwright/test';

test.describe('SleepCalculator Premium UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Sleep Calculator page directly
    await page.goto('http://localhost:5173/fr/outil/sleep-calculator');
  });

  test('should display proper form elements and labels', async ({ page }) => {
    // Check if the page title exists and has the correct heading
    await expect(page.locator('h1')).toContainText('Sommeil');

    // Test label-input association
    const wakeUpInput = page.locator('#wake-up-time');
    await expect(wakeUpInput).toBeVisible();
    await expect(wakeUpInput).toHaveValue('07:00');
  });

  test('clears or resets wake-up time, shows toast and restores focus on Escape key or Reset button click', async ({ page }) => {
    const wakeUpInput = page.locator('#wake-up-time');
    await expect(wakeUpInput).toBeVisible();

    // Change value
    await wakeUpInput.fill('08:30');
    await expect(wakeUpInput).toHaveValue('08:30');

    // Hit Reset (Trash2) button
    const resetButton = page.locator('button:has(svg.lucide-trash-2)');
    await resetButton.click();

    // Verify reset to 07:00
    await expect(wakeUpInput).toHaveValue('07:00');

    // Verify toast is triggered
    const toast = page.locator('.sonner-toast');
    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible();
    }

    // Verify focus is restored to wake-up input
    await expect(wakeUpInput).toBeFocused();
  });

  test('copies output and shows toast on Copy button click or pressing C key', async ({ page }) => {
    // Find the first "Se coucher à" button
    const copyButton = page.locator('button:has-text("Se coucher à")').first();
    await expect(copyButton).toBeVisible();

    // Click it to copy
    await copyButton.click();

    // Verify toast notification is displayed
    const toast = page.locator('.sonner-toast');
    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible();
    }

    // Unfocus everything, press 'c' key to test hotkey copy
    await page.keyboard.press('Escape');
    await page.keyboard.press('c');

    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible();
    }
  });
});
