import { test, expect } from '@playwright/test';

test.describe('Sentinel: URL Leak Prevention', () => {
  test('VigenereCipher does not leak text or key in shared state', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/vigenere-cipher');

    const secretText = 'THIS IS A SECRET MESSAGE';
    const secretKey = 'MYSECRETKEY';

    await page.fill('#vigenere-input', secretText);
    await page.fill('#vigenere-key', secretKey);

    // Capture the shared URL by mocking clipboard
    let sharedUrl = '';
    await page.exposeFunction('captureClipboard', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboard(text);
      };
    });

    // Click the share button (wait for it to appear)
    const shareBtn = page.locator('button:has-text("Partager"), button:has-text("Share config")');
    await shareBtn.waitFor({ state: 'visible' });
    await shareBtn.click();

    // Wait for the clipboard capture to occur
    await expect.poll(() => sharedUrl).toContain('data=');
    const urlObj = new URL(sharedUrl);
    const data = urlObj.searchParams.get('data');

    if (data) {
      const decodedData = JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(data), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));

      expect(decodedData.text).toBeUndefined();
      expect(decodedData.key).toBeUndefined();
      expect(decodedData.mode).toBeDefined();
    }
  });

  test('CesarCipher does not leak text in shared state', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/cesar-cipher');

    const secretText = 'THIS IS A SECRET MESSAGE';
    await page.fill('#input-text', secretText);

    let sharedUrl = '';
    await page.exposeFunction('captureClipboardCesar', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboardCesar(text);
      };
    });

    const shareBtn = page.locator('button:has-text("Partager"), button:has-text("Share config")');
    await shareBtn.waitFor({ state: 'visible' });
    await shareBtn.click();

    expect(sharedUrl).toContain('data=');
    const urlObj = new URL(sharedUrl);
    const data = urlObj.searchParams.get('data');

    if (data) {
      const decodedData = JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(data), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));

      expect(decodedData.text).toBeUndefined();
      expect(decodedData.shift).toBeDefined();
      expect(decodedData.isEncrypt).toBeDefined();
    }
  });

  test('WiFiGenerator does not leak password in shared state', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/wifi-generator');

    const ssid = 'TestNetwork';
    const password = 'SECRET_PASSWORD_123';

    await page.fill('#ssid', ssid);
    await page.fill('#password', password);

    let sharedUrl = '';
    await page.exposeFunction('captureClipboardWiFi', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboardWiFi(text);
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

      // Sentinel: Password must NOT be included in the shared state for privacy.
      expect(decodedData.password).toBeUndefined();
      expect(decodedData.ssid).toBe(ssid);
    }
  });
});
