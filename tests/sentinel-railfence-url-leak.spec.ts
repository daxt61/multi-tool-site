import { test, expect } from '@playwright/test';

test.describe('Sentinel - RailFenceCipher Sensitive State Protection', () => {
  test('does not leak sensitive input text into shared URL state and initializes empty', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/rail-fence-cipher');

    const inputArea = page.locator('#rail-input');
    await expect(inputArea).toBeVisible();

    const sensitiveInputText = 'TOP_SECRET_RAILFENCE_DATA_999';
    await inputArea.fill(sensitiveInputText);

    let sharedUrl = '';
    await page.exposeFunction('captureClipboardRailFence', (text: string) => {
      sharedUrl = text;
    });
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text: string) => {
        (window as any).captureClipboardRailFence(text);
      };
    });

    const shareBtn = page.locator('button:has-text("Partager"), button:has-text("Share config")');
    await shareBtn.waitFor({ state: 'visible' });
    await shareBtn.click();

    await expect.poll(() => sharedUrl).toContain('data=');
    const urlObj = new URL(sharedUrl);
    const dataParam = urlObj.searchParams.get('data');

    if (dataParam) {
      const decodedData = JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(dataParam), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));

      // Sentinel: Sensitive input text must NOT be leaked in the shared state URL
      expect(decodedData.text).toBeUndefined();
      expect(decodedData.rails).toBeDefined();
      expect(decodedData.mode).toBeDefined();

      // Navigating to a URL with a 'text' parameter in data should NOT initialize the input
      await page.goto(sharedUrl);
      await expect(inputArea).toHaveValue('');
    }
  });
});
