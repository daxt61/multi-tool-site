import { test, expect } from '@playwright/test';

test.describe('Sentinel: JWT Decoder Sensitive Token Protection', () => {
  test('does not leak JWT bearer tokens in shareable URL state parameters', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/jwt-decoder');

    const jwtInput = page.locator('#jwt-input');
    await jwtInput.waitFor({ state: 'visible' });

    const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await jwtInput.fill(sampleJwt);

    let sharedUrl = '';
    await page.exposeFunction('captureClipboardJWT', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboardJWT(text);
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

      // Sentinel: Raw JWT token containing bearer/session credentials MUST NOT be leaked in the shared state URL.
      expect(decodedData.jwt).toBeUndefined();
      expect(decodedData.selectedAlg).toBeDefined();
    }
  });
});
