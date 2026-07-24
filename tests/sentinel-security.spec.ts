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

  test('XMLFormatter enforces MAX_LENGTH and shows error', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/xml-formatter');

    // Create an XML string that is too long (over 100,000 chars)
    const longXml = '<root>' + '<child>text</child>'.repeat(10000) + '</root>';

    // Fill the XML input
    await page.fill('#xml-input', longXml);

    // Try to format
    await page.click('button:has-text("Embellir")');

    // Expect error to be shown
    const errorAlert = page.locator('div.bg-rose-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("L'entrée est trop longue");

    // Clear error
    await page.click('button:has-text("Effacer")');
    await expect(errorAlert).not.toBeVisible();

    // Try to minify with too long XML
    await page.fill('#xml-input', longXml);
    await page.click('button:has-text("Minifier")');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("L'entrée est trop longue");
  });

  test('TextToHandwriting enforces MAX_LENGTH and shows error', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/text-to-handwriting');

    // Make sure we loaded correctly
    await expect(page.locator('canvas')).toBeVisible();

    // Fill textarea with more than 10,000 characters
    const longText = 'a'.repeat(10005);
    await page.fill('textarea', longText);

    // Verify error is displayed
    const errorAlert = page.locator('div.bg-rose-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Input is too long. Limit of 10,000 characters.");

    // Verify Download button is disabled
    const downloadBtn = page.locator('button:has-text("Download Image")');
    await expect(downloadBtn).toBeDisabled();

    // Clear text
    await page.click('button:has(svg.lucide-trash2)');
    await expect(errorAlert).not.toBeVisible();
    await expect(downloadBtn).toBeDisabled(); // should still be disabled because input is empty
  });
});
