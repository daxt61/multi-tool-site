import { test, expect } from '@playwright/test';

test.describe('Sentinel - AESCipher Sensitive Data URL Leakage Protection', () => {
  test('does not leak sensitive input plaintext or password into the URL query parameters', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/aes-cipher');

    const sensitiveInputText = 'SECRET_TOP_SECRET_PLAINTEXT_123456';
    const masterPassword = 'MySuperSecretMasterPassword987!';

    await page.fill('#aes-input', sensitiveInputText);
    await page.fill('#aes-password', masterPassword);

    let sharedUrl = '';
    await page.exposeFunction('captureClipboardAES', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboardAES(text);
      };
    });

    const shareBtn = page.locator('button:has-text("Partager"), button:has-text("Share config")');
    await shareBtn.waitFor({ state: 'visible' });
    await shareBtn.click();

    await expect.poll(() => sharedUrl).toContain('data=');
    const urlObj = new URL(sharedUrl);
    const data = urlObj.searchParams.get('data');

    if (data) {
      const decodedData = JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(data), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));

      // Sentinel: Plaintext input and password must NOT be leaked in the shared state URL.
      expect(decodedData.input).toBeUndefined();
      expect(decodedData.password).toBeUndefined();
      expect(decodedData.isEncrypting).toBeDefined();
    }
  });
});
