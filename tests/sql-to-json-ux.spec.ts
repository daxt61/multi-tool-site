import { test, expect } from '@playwright/test';

test.describe('SQL to JSON Converter Upgrade UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-json');
    await page.waitForLoadState('networkidle');
  });

  test('should render and convert default preset reactively', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL en JSON');

    const jsonOutput = page.locator('#json-output');
    const outputText = await jsonOutput.inputValue();

    expect(outputText).toContain('alex_dev');
    expect(outputText).toContain('maria@example.com');
  });

  test('should load preset and update JSON reactively', async ({ page }) => {
    await page.getByRole('button', { name: 'Commandes E-Commerce' }).click();

    await expect(page.getByText('Préréglage chargé !')).toBeVisible();

    const jsonOutput = page.locator('#json-output');
    const outputText = await jsonOutput.inputValue();

    expect(outputText).toContain('ORD-1001');
    expect(outputText).toContain('Sarah Connor');
  });

  test('should handle keyboard shortcuts for copy and reset', async ({ page }) => {
    await page.locator('h1').click();

    // Copy using 'c'
    await page.keyboard.press('c');
    await expect(page.getByText('Copié').first()).toBeVisible();

    // Reset using 'Escape'
    await page.keyboard.press('Escape');
    await expect(page.getByText('Effacé !')).toBeVisible();

    await expect(page.locator('#sql-input')).toHaveValue('');
    await expect(page.locator('#json-output')).toHaveValue('');
    await expect(page.locator('#sql-input')).toBeFocused();
  });
});
