import { test, expect } from '@playwright/test';

test('JSON Formatter UX enhancements work', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-formatter');

  // Verify autofocus
  await expect(page.locator('#json-input')).toBeFocused();

  // Verify localization
  await expect(page.getByText('Entrée JSON')).toBeVisible();

  // Verify character counter
  const label = page.locator('label[for="json-input"]');
  await expect(label).toContainText(/0/);
  await expect(label).toContainText(/100[,.\s]*000/);

  // Fill some JSON
  const input = '{"a":1}';
  await page.fill('#json-input', input);
  await expect(label).toContainText(new RegExp(String(input.length)));

  // Test Beautify
  await page.click('button:has-text("Formater (Beautify)")');
  const output = page.locator('#json-output');
  await expect(output).toHaveValue(/{\n  "a": 1\n}/);

  // Test Fix feedback
  await page.fill('#json-input', "{'b':2}"); // invalid JSON with single quotes
  const fixBtn = page.getByRole('button', { name: 'Réparer' });
  await fixBtn.click();
  await expect(page.getByText('Réparé !')).toBeVisible();
  await expect(page.locator('#json-input')).toHaveValue(/{\n  "b": 2\n}/);

  // Test Copy success state
  await page.click('button:has-text("Formater (Beautify)")');
  const copyBtn = page.locator('button').filter({ hasText: /Copi(er|é)/ }).last();
  await copyBtn.click();
  await expect(page.getByText('Copié')).toBeVisible();
  await expect(copyBtn).toHaveClass(/border-emerald-200/);
});
