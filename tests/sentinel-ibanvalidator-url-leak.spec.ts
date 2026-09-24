import { test, expect } from '@playwright/test';

test.describe('Sentinel - IBANValidator Sensitive Data URL Leakage Protection', () => {
  test('does not leak sensitive IBAN bank account numbers into the URL query parameters', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/iban-validator');

    const sampleIban = 'FR7630006000011234567890123';

    await page.fill('#iban-input', sampleIban);

    let sharedUrl = '';
    await page.exposeFunction('captureClipboardIBAN', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboardIBAN(text);
      };
    });

    const shareBtn = page.locator('button:has-text("Partager config"), button:has-text("Share config")');
    await shareBtn.waitFor({ state: 'visible' });
    await shareBtn.click();

    await expect.poll(() => sharedUrl).toContain('data=');
    const urlObj = new URL(sharedUrl);
    const data = urlObj.searchParams.get('data');

    if (data) {
      const decodedData = JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(data), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));

      // Sentinel: Sensitive IBAN must NOT be leaked in the shared state URL.
      expect(decodedData.iban).toBeUndefined();
    }
  });
});
