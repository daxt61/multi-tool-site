import { test, expect } from '@playwright/test';

test.describe('Sentinel: Punycode Converter Client-Side DoS Mitigation', () => {
  test('PunycodeConverter enforces MAX_LENGTH limit and displays error alert banner on oversized input', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/punycode-converter');

    // 1. Verify normal conversion works
    await page.fill('#unicode-input', 'mañana.com');
    await page.waitForTimeout(300);
    const punyOutput = await page.inputValue('#puny-input');
    expect(punyOutput).toBe('xn--maana-pta.com');

    // 2. Test oversized input in unicode input (> 100,000 characters)
    const oversizedInput = 'a'.repeat(100001);
    await page.fill('#unicode-input', oversizedInput);
    await page.waitForTimeout(300);

    // Verify error banner is visible
    const errorBanner = page.locator('.bg-rose-50');
    await expect(errorBanner).toBeVisible();

    // Verify output is cleared to prevent thread freezing
    const clearedPuny = await page.inputValue('#puny-input');
    expect(clearedPuny).toBe('');

    // 3. Test oversized input in punycode input
    await page.fill('#unicode-input', 'test.com');
    await page.fill('#puny-input', 'xn--' + 'a'.repeat(100000));
    await page.waitForTimeout(300);

    // Verify error banner is visible
    await expect(errorBanner).toBeVisible();

    // Verify unicode output is cleared
    const clearedUnicode = await page.inputValue('#unicode-input');
    expect(clearedUnicode).toBe('');
  });
});
