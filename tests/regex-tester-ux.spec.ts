import { test, expect } from '@playwright/test';

test('verify RegExTester premium upgrades', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/regex-tester');

  // Verify custom Kbd badges exist
  const escKbd = page.locator('kbd:has-text("Esc")').first();
  await expect(escKbd).toBeVisible();

  const cKbd = page.locator('kbd:has-text("C")').first();
  await expect(cKbd).toBeVisible();

  // Test copy action toast trigger
  const copyBtn = page.locator('button:has-text("Copier")').first();
  await copyBtn.click();

  const toast = page.locator('li[data-sonner-toast]');
  await expect(toast).toBeVisible();
});
