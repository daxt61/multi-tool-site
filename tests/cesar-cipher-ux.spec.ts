import { test, expect } from '@playwright/test';

test.describe('CesarCipher Premium UX & Accessibility E2E Tests', () => {
  test('CesarCipher translates text dynamically, respects shift, handles shortcuts, and focus preservation', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/cesar-cipher');

    const inputArea = page.locator('#input-text');
    const resultArea = page.locator('.bg-slate-900 div.flex-grow');

    // 1. Check range slider aria properties are set
    const slider = page.locator('#shift-range');
    await expect(slider).toHaveAttribute('aria-valuemin', '1');
    await expect(slider).toHaveAttribute('aria-valuemax', '25');
    await expect(slider).toHaveAttribute('aria-valuenow', '3');

    // 2. Type text and ensure dynamic encryption
    await inputArea.fill('Hello World');
    await expect(resultArea).toContainText('Khoor Zruog');

    // 3. Test copy button triggers sonner toast
    const copyButton = page.locator('.bg-slate-900 button:has-text("Copier")');
    await copyButton.click();
    await expect(page.locator('text=Lien copié dans le presse-papiers')).toBeVisible();

    // 4. Test Escape key resets inputs and restores focus to input
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // 5. Test Randomize shift shortcut 'R' when input is not focused
    await inputArea.fill('Hello');
    await page.locator('h3:has-text("Résultat")').first().click(); // unfocus input
    await expect(inputArea).not.toBeFocused();

    // Store old shift
    const oldShift = await slider.inputValue();
    await page.keyboard.press('r');
    const newShift = await slider.inputValue();
    expect(oldShift).not.toBe(newShift);
  });
});
