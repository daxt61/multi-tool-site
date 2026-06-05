import { test, expect } from '@playwright/test';

test('HTTP Header Parser should be accessible and functional', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/http-header-parser');

  // Check if title is correct
  await expect(page.locator('h1')).toContainText('HTTP Header Parser');

  // Input some headers
  const rawHeaders = 'Content-Type: application/json\nCache-Control: no-cache\nAuthorization: Bearer token123';
  await page.fill('textarea', rawHeaders);

  // Check if parsed in table
  await expect(page.locator('table')).toBeVisible();
  await expect(page.locator('td', { hasText: 'Content-Type' })).toBeVisible();
  await expect(page.locator('td', { hasText: 'application/json' })).toBeVisible();

  // Toggle to JSON view
  await page.click('button:has-text("JSON View")');
  await expect(page.locator('pre')).toContainText('"Content-Type": "application/json"');
});

test('Loan Calculator should be localized', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/loan-calculator');
  await expect(page.locator('h1')).toContainText('Loan Calculator');
  await expect(page.locator('label', { hasText: 'Principal Amount' })).toBeVisible();

  await page.goto('http://localhost:5173/fr/outil/loan-calculator');
  await expect(page.locator('h1')).toContainText('Prêt');
  await expect(page.locator('label', { hasText: 'Montant emprunté' })).toBeVisible();
});
