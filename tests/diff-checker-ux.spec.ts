import { test, expect } from '@playwright/test';

test.describe('Diff Checker Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/diff-checker');
  });

  test('should support aria-pressed state toggling on view mode buttons', async ({ page }) => {
    const unifiedBtn = page.getByRole('button', { name: /Unifié/i });
    const splitBtn = page.getByRole('button', { name: /Divisé/i });

    // Initial state: unified is pressed
    await expect(unifiedBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(splitBtn).toHaveAttribute('aria-pressed', 'false');

    // Click split view mode
    await splitBtn.click();
    await expect(unifiedBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(splitBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should restore focus to #text1 on reset button click', async ({ page }) => {
    const text1 = page.locator('#text1');
    await text1.fill('Hello World');

    const resetButton = page.getByRole('button', { name: /Réinitialiser/i });
    await resetButton.click();

    await expect(text1).toHaveValue('');
    await expect(text1).toBeFocused();
  });

  test('should swap text input values when swap button is clicked', async ({ page }) => {
    const text1 = page.locator('#text1');
    const text2 = page.locator('#text2');

    await text1.fill('Original Content');
    await text2.fill('Updated Content');

    const swapButton = page.getByRole('button', { name: /Inverser/i });
    await swapButton.click();

    await expect(text1).toHaveValue('Updated Content');
    await expect(text2).toHaveValue('Original Content');
  });
});
