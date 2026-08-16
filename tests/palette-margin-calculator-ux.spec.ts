import { test, expect } from '@playwright/test';

test.describe('Margin Calculator UX & Accessibility', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('should associate labels explicitly with inputs in French and English', async ({ page }) => {
    // French
    await page.goto('http://localhost:5173/fr/outil/margin-calculator');
    await expect(page.locator('label[for="cost-price"]')).toContainText("Prix d'achat (Coût)");
    await expect(page.locator('label[for="selling-price"]')).toContainText("Prix de vente");
    await expect(page.locator('label[for="margin-percent"]')).toContainText("Marge (%)");
    await expect(page.locator('label[for="markup-percent"]')).toContainText("Coefficient (Markup %)");

    // English
    await page.goto('http://localhost:5173/en/outil/margin-calculator');
    await expect(page.locator('label[for="cost-price"]')).toContainText("Cost Price");
    await expect(page.locator('label[for="selling-price"]')).toContainText("Selling Price");
    await expect(page.locator('label[for="margin-percent"]')).toContainText("Margin (%)");
    await expect(page.locator('label[for="markup-percent"]')).toContainText("Markup (%)");
  });

  test('should perform calculations and update profit display', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/margin-calculator');
    await page.fill('#cost-price', '80');
    await page.fill('#selling-price', '100');

    await page.click('button:has-text("Calculer marge et coefficient")');

    await expect(page.locator('#margin-percent')).toHaveValue('20.00');
    await expect(page.locator('#markup-percent')).toHaveValue('25.00');
    await expect(page.getByText('20.00€')).toBeVisible();
    await expect(page.getByText('Profit')).toBeVisible();
  });

  test('should restore focus to #cost-price when cleared', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/margin-calculator');
    await page.fill('#cost-price', '100');
    await page.fill('#selling-price', '150');

    const clearButton = page.locator('button:has-text("Effacer")');
    await clearButton.click();

    await expect(page.locator('#cost-price')).toHaveValue('');
    await expect(page.locator('#selling-price')).toHaveValue('');
    await expect(page.locator('#cost-price')).toBeFocused();
  });

  test('should handle Escape keyboard shortcut to clear and restore focus', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/margin-calculator');
    await page.fill('#cost-price', '50');
    await page.fill('#selling-price', '75');

    await page.keyboard.press('Escape');

    await expect(page.locator('#cost-price')).toHaveValue('');
    await expect(page.locator('#selling-price')).toHaveValue('');
    await expect(page.locator('#cost-price')).toBeFocused();
  });

  test('should copy calculation summary via button click', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/margin-calculator');
    await page.fill('#cost-price', '80');
    await page.fill('#selling-price', '100');
    await page.click('button:has-text("Calculer marge et coefficient")');

    const copyButton = page.locator('button:has-text("Copier le résumé")');
    await copyButton.click();

    await expect(page.getByText('Résumé de la marge copié dans le presse-papiers !')).toBeVisible();
  });

  test('should copy calculation summary via C keyboard shortcut when inputs are unfocused', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/margin-calculator');
    await page.fill('#cost-price', '80');
    await page.fill('#selling-price', '100');
    await page.click('button:has-text("Calculer marge et coefficient")');

    // Unfocus active element
    await page.locator('h1').first().click();

    await page.keyboard.press('c');

    await expect(page.getByText('Résumé de la marge copié dans le presse-papiers !')).toBeVisible();
  });

  test('should display visual <Kbd> hotkey badges', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/margin-calculator');
    await expect(page.locator('kbd', { hasText: /^Esc$/ }).first()).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ }).first()).toBeVisible();
  });
});
