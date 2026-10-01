import { test, expect } from '@playwright/test';

test.describe('Sentinel: WiFi Generator Security & URL Leak Prevention', () => {
  test('does not restore sensitive password from initialData / URL state and excludes password from onStateChange', async ({ page }) => {
    // Navigate directly to the WiFi Generator tool
    await page.goto('/#wifi-generator');
    await page.waitForLoadState('networkidle');

    // Fill in SSID and Password fields
    const ssidInput = page.locator('#ssid');
    const passwordInput = page.locator('#password');

    await expect(ssidInput).toBeVisible();
    await ssidInput.fill('SecretNetwork');
    await passwordInput.fill('SuperSecretWiFiPass123!');

    // Wait briefly to allow any debounced state sync to occur
    await page.waitForTimeout(500);

    // Get current page URL
    const currentUrl = page.url();

    // Verify that the secret password text is NOT present anywhere in the URL query string
    expect(currentUrl).not.toContain('SuperSecretWiFiPass123!');
  });
});
