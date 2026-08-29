import { test, expect } from '@playwright/test';

test.describe('ROI Calculator UX & Accessibility', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('should associate labels explicitly with inputs in French and English', async ({ page }) => {
    // French
    await page.goto('http://localhost:5173/fr/outil/roi-calculator');
    await expect(page.locator('label[for="initialInvestment"]')).toContainText("Investissement Initial");
    await expect(page.locator('label[for="finalValue"]')).toContainText("Valeur Finale");
    await expect(page.locator('label[for="duration"]')).toContainText("Durée (années)");

    // English
    await page.goto('http://localhost:5173/en/outil/roi-calculator');
    await expect(page.locator('label[for="initialInvestment"]')).toContainText("Initial Investment");
    await expect(page.locator('label[for="finalValue"]')).toContainText("Final Value");
    await expect(page.locator('label[for="duration"]')).toContainText("Duration (years)");
  });

  test('should calculate ROI stats dynamically', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/roi-calculator');
    await page.fill('#initialInvestment', '10000');
    await page.fill('#finalValue', '15000');
    await page.fill('#duration', '5');

    await expect(page.getByText('+50.00%')).toBeVisible();
    await expect(page.getByText(/5.*000.*00€/)).toBeVisible();
    await expect(page.getByText('8.45%')).toBeVisible(); // Annualized (15000/10000)^(1/5) - 1 = 8.447%
    await expect(page.getByText('x1.50')).toBeVisible();
  });

  test('should restore focus to #initialInvestment when cleared', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/roi-calculator');
    await page.fill('#initialInvestment', '10000');
    await page.fill('#finalValue', '12000');

    const clearButton = page.getByRole('button', { name: 'Effacer' });
    await clearButton.click();

    await expect(page.locator('#initialInvestment')).toHaveValue('');
    await expect(page.locator('#finalValue')).toHaveValue('');
    await expect(page.locator('#initialInvestment')).toBeFocused();
    await expect(page.getByText('Calculateur ROI réinitialisé !')).toBeVisible();
  });

  test('should handle Escape keyboard shortcut to clear and restore focus', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/roi-calculator');
    await page.fill('#initialInvestment', '5000');
    await page.fill('#finalValue', '7500');

    await page.keyboard.press('Escape');

    await expect(page.locator('#initialInvestment')).toHaveValue('');
    await expect(page.locator('#finalValue')).toHaveValue('');
    await expect(page.locator('#initialInvestment')).toBeFocused();
  });

  test('should copy calculation summary via button click', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/roi-calculator');
    await page.fill('#initialInvestment', '10000');
    await page.fill('#finalValue', '15000');

    const copyButton = page.getByRole('button', { name: 'Copier le résumé' });
    await copyButton.click();

    await expect(page.getByText('Rapport ROI copié dans le presse-papiers !')).toBeVisible();
  });

  test('should copy summary via C keyboard shortcut when inputs are unfocused', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/roi-calculator');
    await page.fill('#initialInvestment', '10000');
    await page.fill('#finalValue', '15000');

    // Unfocus inputs
    await page.locator('h4').first().click();

    await page.keyboard.press('c');

    await expect(page.getByText('Rapport ROI copié dans le presse-papiers !')).toBeVisible();
  });

  test('should display visual <Kbd> hotkey badges', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/roi-calculator');
    await expect(page.locator('kbd', { hasText: /^Esc$/ }).first()).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ }).first()).toBeVisible();
  });
});
