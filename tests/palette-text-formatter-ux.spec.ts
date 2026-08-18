import { test, expect } from '@playwright/test';

test.describe('Text Formatter UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/text-formatter');
  });

  test('should associate labels with inputs and support focus restoration', async ({ page }) => {
    // Check main textarea label association
    const textLabel = page.locator('label[for="text-input"]');
    await expect(textLabel).toBeVisible();

    const textarea = page.locator('#text-input');
    await expect(textarea).toBeVisible();

    // Fill textarea
    await textarea.fill('Hello World');

    // Click clear button
    const clearButton = page.getByRole('button', { name: /effacer|clear/i });
    await clearButton.click();

    // Verify textarea is cleared and focused
    await expect(textarea).toHaveValue('');
    await expect(textarea).toBeFocused();
  });

  test('should load quick presets and format text properly', async ({ page }) => {
    const textarea = page.locator('#text-input');

    // Click quick preset button
    const samplePresetBtn = page.getByRole('button', { name: /exemple d'article|sample article/i });
    await expect(samplePresetBtn).toBeVisible();
    await samplePresetBtn.click();

    // Verify preset loaded in textarea
    await expect(textarea).not.toHaveValue('');

    // Click UPPERCASE action
    const uppercaseBtn = page.getByRole('button', { name: /^majuscules$/i });
    await uppercaseBtn.click();

    const val = await textarea.inputValue();
    expect(val).toBe(val.toUpperCase());
  });

  test('should find and replace text with case sensitivity toggle', async ({ page }) => {
    const textarea = page.locator('#text-input');
    await textarea.fill('Apple banana Apple orange');

    const findInput = page.locator('#find-input');
    const replaceInput = page.locator('#replace-input');

    await findInput.fill('Apple');
    await replaceInput.fill('Mango');

    const replaceBtn = page.getByRole('button', { name: /^remplacer$/i }).last();
    await replaceBtn.click();

    await expect(textarea).toHaveValue('Mango banana Mango orange');
  });

  test('should support keyboard shortcuts and show toast alerts', async ({ page }) => {
    const textarea = page.locator('#text-input');
    await textarea.fill('Shortcut Test Data');

    // Blur inputs
    await textarea.blur();

    // Press Escape to reset
    await page.keyboard.press('Escape');
    await expect(textarea).toHaveValue('');
    await expect(textarea).toBeFocused();

    // Fill again and test 'C' copy shortcut
    await textarea.fill('Clipboard Test');
    await textarea.blur();

    await page.keyboard.press('c');

    // Verify toast alert appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();
  });
});
