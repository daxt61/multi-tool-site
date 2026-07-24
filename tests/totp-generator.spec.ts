import { test, expect } from '@playwright/test';

test('verify TOTPGenerator functionalities', async ({ page }) => {
  // Navigation to the TOTP Generator tool path
  await page.goto('http://localhost:5173/fr/outil/totp-generator');

  // Verify parameters section header exists
  const heading = page.locator('h3:has-text("Paramètres de l\'authentificateur TOTP")');
  await expect(heading).toBeVisible();

  // Verify elements are present on screen
  const secretInput = page.locator('input#secret-input');
  await expect(secretInput).toBeVisible();

  const secretValue = await secretInput.inputValue();
  // Expect a cryptographically secure random base32 encoded secret key
  expect(secretValue.length).toBeGreaterThan(10);

  // Check generated code display
  const otpDisplay = page.locator('span.font-mono').first();
  await expect(otpDisplay).toBeVisible();
  const text = await otpDisplay.textContent();
  expect(text).toMatch(/[0-9]{3}-[0-9]{3}/);

  // Verify copying token changes clipboard state (or works)
  const copyBtn = page.locator('button[aria-label="Copier le jeton actuel"]');
  if (await copyBtn.count() > 0) {
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    // Toast notification confirmation should arrive
    const toast = page.locator('li[data-sonner-toast]');
    await expect(toast).toBeVisible();
  }

  // Verify validator tool validates code correctly
  const testInput = page.locator('input[placeholder="123456"]');
  await expect(testInput).toBeVisible();
  await testInput.fill('111111');

  const verifyBtn = page.locator('button:has-text("Vérifier")');
  await verifyBtn.click();

  // Failed banner must be visible because 111111 is incorrect
  const failBanner = page.locator('span:has-text("Échec de la validation")');
  await expect(failBanner).toBeVisible();
});
