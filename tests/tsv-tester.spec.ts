import { test, expect } from '@playwright/test';

test.describe('TSV Tester & Validator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/tsv-tester');
    await page.waitForLoadState('networkidle');
  });

  test('should render TSV tester interface correctly with input and stats', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Testeur & Validateur TSV|TSV Tester/i);
    await expect(page.locator('#tsv-input')).toBeVisible();
    await expect(page.getByRole('button', { name: /Catalogue Propre/i })).toBeVisible();
  });

  test('should analyze sample preset TSV data and calculate quality stats', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue Propre/i }).click();
    await expect(page.locator('#tsv-input')).not.toHaveValue('');

    // Verify stats cards
    await expect(page.getByText('Lignes de Données')).toBeVisible();
    await expect(page.getByText('Colonnes Attendues')).toBeVisible();
    await expect(page.getByText('Lignes Valides')).toBeVisible();

    // Verify column types table
    await expect(page.getByText('Types de Colonnes Déduits')).toBeVisible();
    await expect(page.getByText('Product_ID:')).toBeVisible();
    await expect(page.getByText('Name:')).toBeVisible();
    await expect(page.getByText('Price:')).toBeVisible();
  });

  test('should detect column count mismatch and empty cells', async ({ page }) => {
    await page.getByRole('button', { name: /TSV avec Erreurs/i }).click();

    // Should report issues
    await expect(page.getByText('Journal Détaillé des Erreurs')).toBeVisible();
    await expect(page.getByText(/La ligne contient/i).first()).toBeVisible();
  });

  test('should handle clear action with Escape hotkey', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue Propre/i }).click();
    await expect(page.locator('#tsv-input')).not.toHaveValue('');

    await page.keyboard.press('Escape');
    await expect(page.locator('#tsv-input')).toHaveValue('');
  });

  test('should copy report with C hotkey when input is not focused', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue Propre/i }).click();
    await page.locator('body').click(); // Unfocus text input

    await page.keyboard.press('c');
    // Sonner toast notification should appear
    await expect(page.getByText(/Rapport de validation copié/i)).toBeVisible();
  });
});
