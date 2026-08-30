import { test, expect } from '@playwright/test';

test.describe('WiFi Generator Tool Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/wifi-generator');
  });

  test('renders form controls with accessibility attributes', async ({ page }) => {
    const ssidInput = page.locator('#ssid');
    const passwordInput = page.locator('#password');
    const showPasswordBtn = page.locator('button[aria-label="Afficher le mot de passe"]');

    await expect(ssidInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(showPasswordBtn).toBeVisible();

    // Toggle password visibility
    await showPasswordBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(page.locator('button[aria-label="Masquer le mot de passe"]')).toBeVisible();

    await page.locator('button[aria-label="Masquer le mot de passe"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('updates security selection aria-pressed state', async ({ page }) => {
    const wpaBtn = page.locator('button:has-text("WPA")');
    const wepBtn = page.locator('button:has-text("WEP")');
    const noneBtn = page.locator('button:has-text("Aucune")');

    await expect(wpaBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(wepBtn).toHaveAttribute('aria-pressed', 'false');

    await wepBtn.click();
    await expect(wepBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(wpaBtn).toHaveAttribute('aria-pressed', 'false');

    await noneBtn.click();
    await expect(noneBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('handles Escape keyboard shortcut to clear form and focus SSID input', async ({ page }) => {
    const ssidInput = page.locator('#ssid');
    await ssidInput.fill('MyNetwork');

    await ssidInput.focus();
    await page.keyboard.press('Escape');

    await expect(ssidInput).toHaveValue('');
    await expect(ssidInput).toBeFocused();
  });

  test('handles C keyboard shortcut to copy raw string when unfocused', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const ssidInput = page.locator('#ssid');
    await ssidInput.fill('HomeWiFi');

    // Click outside input (e.g. title heading) to blur
    await page.locator('h3').first().click();

    // Press C hotkey
    await page.keyboard.press('c');

    const toast = page.getByText(/Copié|Copied/i).first();
    await expect(toast).toBeVisible();
  });
});
