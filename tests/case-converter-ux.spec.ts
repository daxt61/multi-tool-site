import { test, expect } from '@playwright/test';

test('CaseConverter micro-UX: Escape key clears and focuses', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/case-converter');

  const textarea = page.locator('#case-text');

  // Fill some text
  await textarea.fill('Hello World');
  await expect(textarea).toHaveValue('Hello World');

  // Press Escape
  await textarea.press('Escape');

  // Should be empty
  await expect(textarea).toHaveValue('');

  // Should be focused
  const isFocused = await textarea.evaluate(node => document.activeElement === node);
  expect(isFocused).toBe(true);
});

test('CaseConverter micro-UX: visible Escape hint', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/case-converter');

  // Check for the Esc hint
  const escHint = page.locator('kbd', { hasText: /^Esc$/ });
  await expect(escHint).toBeVisible();
});

test('CaseConverter micro-UX: localized options title', async ({ page }) => {
  // French
  await page.goto('http://localhost:5173/fr/outil/case-converter');
  await expect(page.getByText('Options de conversion')).toBeVisible();

  // English
  await page.goto('http://localhost:5173/en/outil/case-converter');
  await expect(page.getByText('Conversion Options')).toBeVisible();
});
