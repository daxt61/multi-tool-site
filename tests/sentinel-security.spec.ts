import { test, expect } from '@playwright/test';

test.describe('Sentinel Security Fixes', () => {
  test('CURLConverter mitigates variable interpolation in PHP', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/curl-converter');

    // Select PHP language
    await page.click('button:has-text("PHP cURL")');

    // Input a cURL command with a potential variable interpolation
    const input = 'curl https://api.example.com/$sensitive_var -H "X-API-Key: $key"';
    await page.fill('#curl-input', input);

    const output = await page.inputValue('#output-area');

    // PHP output should use single quotes for URL and headers
    expect(output).toContain("curl_setopt($ch, CURLOPT_URL, 'https://api.example.com/$sensitive_var');");
    expect(output).toContain("'X-API-Key: $key'");

    // It should NOT use double quotes (which would interpolate in PHP if we weren't careful)
    expect(output).not.toContain('CURLOPT_URL, "');
  });

  test('WiFiGenerator escapes special characters and enforces MAX_LENGTH', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/wifi-generator');

    // Test escaping
    await page.fill('#ssid', 'My:WiFi;Network\\');
    await page.fill('#password', 'secret:pass;word"');

    const rawString = await page.innerText('code');

    // Verify MECARD escaping in the raw string
    expect(rawString).toContain('S:My\\:WiFi\\;Network\\\\');
    expect(rawString).toContain('P:secret\\:pass\\;word\\"');

    // Test MAX_LENGTH enforcement (100 chars)
    const longSSID = 'a'.repeat(150);
    await page.fill('#ssid', longSSID);
    const ssidValue = await page.inputValue('#ssid');
    expect(ssidValue.length).toBe(100);

    const longPass = 'b'.repeat(150);
    await page.fill('#password', longPass);
    const passValue = await page.inputValue('#password');
    expect(passValue.length).toBe(100);
  });
});
