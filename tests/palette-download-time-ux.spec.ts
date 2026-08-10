import { test, expect } from '@playwright/test';

test.describe('Download Time Calculator Premium UX & Accessibility', () => {
  test('should support localization, verify calculation outputs, reset triggers with focus preservation, copy actions with toasts, and keyboard hotkeys', async ({ page }) => {
    // Navigate to the French route of the tool
    await page.goto('http://localhost:5173/fr/outil/download-time');

    // 1. Verify localized Title & Labels in French
    await expect(page.locator('h1')).toContainText('Temps de téléchargement');
    await expect(page.locator('label[for="fileSize"]')).toContainText('Taille du fichier');
    await expect(page.locator('label[for="speed"]')).toContainText('Vitesse de connexion');

    // 2. Clear inputs and verify French toast feedback
    const clearButton = page.locator('button:has-text("Effacer")');
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify focus is restored to the primary fileSize input
    const fileSizeInput = page.locator('#fileSize');
    await expect(fileSizeInput).toBeFocused();
    await expect(fileSizeInput).toHaveValue('');

    // Fill custom calculations
    await fileSizeInput.fill('10'); // 10 GB
    const speedInput = page.locator('#speed');
    await speedInput.fill('100'); // 100 Mbps

    // 10 GB = 10 * 1024 * 8 Megabits = 81,920 Megabits
    // 100 Mbps connection speed
    // 81,920 / 100 = 819.2 seconds = 13m 39s
    const resultDisplay = page.locator('.text-4xl.md\\:text-6xl.font-mono');
    await expect(resultDisplay).toContainText('13m 39s');

    // 3. Navigate to English route and verify same calculation
    await page.goto('http://localhost:5173/en/outil/download-time');
    await expect(page.locator('h1')).toContainText('Download Time');
    await expect(page.locator('label[for="fileSize"]')).toContainText('File Size');

    await page.locator('#fileSize').fill('2'); // 2 GB
    await page.locator('#speed').fill('50'); // 50 Mbps
    // 2 GB = 2 * 1024 * 8 Megabits = 16,384 Megabits
    // 50 Mbps connection speed
    // 16,384 / 50 = 327.68 seconds = 5m 27s
    await expect(resultDisplay).toContainText('5m 27s');

    // Mock clipboard and test copy action
    await page.evaluate(() => {
      (window as any).clipboardText = "";
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    const copyButton = page.locator('button[aria-label="Copy summary"]');
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify toast notification and clipboard content
    const copyToast = page.getByText('Download time calculation summary copied to clipboard!');
    await expect(copyToast).toBeVisible();

    const clipboardText = await page.evaluate(() => (window as any).clipboardText);
    expect(clipboardText).toContain('File Size: 2 GB');
    expect(clipboardText).toContain('Connection Speed: 50 Mbps');
    expect(clipboardText).toContain('Estimated Time: 5m 27s');

    // 4. Test global keyboard shortcut: C to copy (when inputs not focused)
    await page.evaluate(() => { (window as any).clipboardText = ""; });
    await page.locator('body').focus(); // Ensure inputs are not focused
    await page.keyboard.press('c');
    const clipboardTextAfterHotkey = await page.evaluate(() => (window as any).clipboardText);
    expect(clipboardTextAfterHotkey).toContain('Estimated Time: 5m 27s');

    // 5. Test global keyboard shortcut: Escape to clear
    await page.keyboard.press('Escape');
    await expect(page.locator('#fileSize')).toHaveValue('');
    await expect(page.locator('#speed')).toHaveValue('');
    await expect(page.locator('#fileSize')).toBeFocused();

    // Confirm toast appeared for clear action
    const clearToast = page.getByText('Inputs cleared successfully!');
    await expect(clearToast).toBeVisible();
  });
});
