import { test, expect } from '@playwright/test';

test.describe('Number to Words UX & Accessibility', () => {
  test('should associate label explicitly with #number-input and display presets', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/number-to-words');
    await expect(page.locator('label[for="number-input"]')).toContainText('Nombre à convertir');

    // Presets header
    await expect(page.locator('text=Préréglages Rapides :')).toBeVisible();
    await expect(page.locator('button:has-text("Un Million (1000000)")')).toBeVisible();
  });

  test('should convert numbers into words in French and English', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/number-to-words');

    await page.fill('#number-input', '123');
    await expect(page.locator('div[aria-live="polite"]')).toContainText('cent vingt-trois');

    // Switch to English
    await page.click('button:has-text("Anglais")');
    await expect(page.locator('div[aria-live="polite"]')).toContainText('one hundred twenty-three');
  });

  test('should handle presets clicking and focus restoration on clear', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/number-to-words');

    // Click preset
    await page.click('button:has-text("Année 2025 (2025)")');
    await expect(page.locator('#number-input')).toHaveValue('2025');

    // Clear
    await page.click('button:has-text("Effacer")');
    await expect(page.locator('#number-input')).toHaveValue('');
    await expect(page.locator('#number-input')).toBeFocused();
  });

  test('should handle Escape and C keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/number-to-words');

    await page.fill('#number-input', '456789');
    await expect(page.locator('#number-input')).toBeFocused();

    // Press Escape while focused
    await page.keyboard.press('Escape');
    await expect(page.locator('#number-input')).toHaveValue('');
    await expect(page.locator('#number-input')).toBeFocused();

    // Type number and blur
    await page.fill('#number-input', '1000000');
    await page.locator('#number-input').blur();

    // Press C to copy
    await page.keyboard.press('c');
    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();
  });

  test('should display visual <Kbd> hotkey badges', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/number-to-words');

    await expect(page.locator('kbd', { hasText: /^Esc$/ }).first()).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ }).first()).toBeVisible();
  });
});
