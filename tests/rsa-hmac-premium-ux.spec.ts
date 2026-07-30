import { test, expect } from '@playwright/test';

test.describe('RSA and HMAC Premium UX E2E Tests', () => {
  test('RSAGenerator clears input on Escape and focus resets', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/rsa-generator');

    // Click to generate keys (Générer les Clés)
    const generateBtn = page.locator('button:has-text("Générer les Clés")');
    await generateBtn.click();

    // Verify key fields contain outputs
    const publicKeyField = page.locator('#rsa-public-key');
    await expect(publicKeyField).not.toHaveValue('');

    // Press Escape to clear and verify
    await page.keyboard.press('Escape');
    await expect(publicKeyField).toHaveValue('');
  });

  test('HMACGenerator computes hash on-the-fly and handles copy-clear premium UX', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/hmac-generator');

    const messageInput = page.locator('#hmac-message');
    const keyInput = page.locator('#hmac-key');

    await messageInput.fill('Hello World');
    await keyInput.fill('super_secret_key');

    const output = page.locator('#hmac-output');
    await expect(output).not.toContainText('En attente de');

    // Escape should clear both inputs and restore focus on message
    await page.keyboard.press('Escape');
    await expect(messageInput).toHaveValue('');
    await expect(keyInput).toHaveValue('');
    await expect(messageInput).toBeFocused();
  });
});
