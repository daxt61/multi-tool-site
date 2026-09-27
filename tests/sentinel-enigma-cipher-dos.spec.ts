import { test, expect } from '@playwright/test';

test.describe('Sentinel: EnigmaCipher DoS Guard', () => {
  test('EnigmaCipher restricts input length to MAX_LENGTH to prevent client-side DoS', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/enigma-cipher');

    const inputArea = page.locator('textarea[placeholder*="Type message here"]');
    await expect(inputArea).toBeVisible();

    // Input normal text
    await inputArea.fill('ENIGMAMESSAGE');
    const outputDiv = page.locator('div.font-mono.text-2xl.uppercase');
    await expect(outputDiv).not.toBeEmpty();

    // Input excessively long text (> 100,000 characters)
    const longText = 'A'.repeat(100001);
    await inputArea.fill(longText);

    // Verify error alert is displayed
    const errorAlert = page.locator('.bg-rose-50');
    await expect(errorAlert).toBeVisible();
  });
});
