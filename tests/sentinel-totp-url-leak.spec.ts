import { test, expect } from '@playwright/test';

test.describe('Sentinel - TOTPGenerator Sensitive Secret State Protection', () => {
  test('does not leak sensitive Base32 2FA secret key into the URL query parameters', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/totp-generator');

    const secretInput = page.locator('#secret-input');
    await secretInput.waitFor({ state: 'visible' });

    const testSecret = 'JBSWY3DPEHPK3PXP';
    await secretInput.fill(testSecret);

    let sharedUrl = '';
    await page.exposeFunction('captureClipboardTOTP', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboardTOTP(text);
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

      // Sentinel: Base32 2FA secret key must NOT be leaked in the shared state URL.
      expect(decodedData.secret).toBeUndefined();
      expect(decodedData.accountName).toBeDefined();
      expect(decodedData.issuer).toBeDefined();
      expect(decodedData.digits).toBeDefined();
      expect(decodedData.period).toBeDefined();
    }
  });
});
