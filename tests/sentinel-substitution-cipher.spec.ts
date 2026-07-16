import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Substitution Cipher Sentinel Verification', () => {
  test('Randomize key uses Fisher-Yates and is functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/substitution-cipher`);

    const keyInput = page.locator('input[type="text"]').first();
    const initialKey = await keyInput.inputValue();

    // Click Randomize button
    await page.click('button:has-text("Random")');

    const randomizedKey = await keyInput.inputValue();
    expect(randomizedKey).not.toBe(initialKey);
    expect(randomizedKey.length).toBe(26);

    // Check that all letters are present exactly once
    const sortedKey = randomizedKey.split('').sort().join('');
    expect(sortedKey).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    // Test encryption with the new key
    const inputArea = page.locator('textarea').first();
    await inputArea.fill('HELLO');

    const outputArea = page.locator('textarea').last();
    const encryptedText = await outputArea.inputValue();
    expect(encryptedText).not.toBe('HELLO');
    expect(encryptedText.length).toBe(5);

    // Test Reset functionality (Escape key)
    await page.keyboard.press('Escape');
    await expect(inputArea).toBeEmpty();
  });
});
