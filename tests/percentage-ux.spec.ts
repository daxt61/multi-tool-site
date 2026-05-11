import { test, expect } from '@playwright/test';

test('Percentage Calculator accessibility and localization', async ({ page, baseURL }) => {
  const base = baseURL || 'http://localhost:5173';
  await page.goto(`${base}/en/outil/percentage`);

  // Check English localization for connectors
  await expect(page.getByText('% of', { exact: true })).toBeVisible();
  await expect(page.getByText('of', { exact: true }).first()).toBeVisible();

  // Switch to French
  await page.goto(`${base}/fr/outil/percentage`);
  await expect(page.getByText('% de', { exact: true })).toBeVisible();
  await expect(page.getByText('de', { exact: true }).first()).toBeVisible();

  // Test keyboard accessibility for copy buttons
  await page.fill('#percent-val', '20');
  await page.fill('#total-val', '100');

  const copyButton = page.locator('button[aria-label="Copier le résultat du pourcentage du total"]');

  // Initially opacity-0 or similar, but focus should reveal it if we have focus-visible:opacity-100
  // Note: Playwright's focus might not "reveal" it visually in a way that matches hover,
  // but it should be interactable.
  await copyButton.focus();

  // We can't easily test "visibility" if it's based on focus-visible without complex JS,
  // but we can check if the button is enabled and has the correct aria-label.
  await expect(copyButton).toBeEnabled();

  // Ensure "Clear" buttons in subsections are disabled/hidden when empty
  const subClear = page.locator('button:has-text("Effacer")').nth(1); // The one in the first section
  await page.fill('#percent-val', '');
  await page.fill('#total-val', '');
  await expect(subClear).toHaveCSS('opacity', '0');
  await expect(subClear).toBeDisabled();
});
