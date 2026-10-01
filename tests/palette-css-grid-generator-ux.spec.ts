import { test, expect } from '@playwright/test';

test.describe('CSS Grid Generator Micro-UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/css-grid');
  });

  test('should render quick presets and apply them with aria-pressed state', async ({ page }) => {
    const preset3x3 = page.getByRole('button', { name: /Grille 3x3/i });
    const preset12col = page.getByRole('button', { name: /Système 12 Col/i });

    await expect(preset3x3).toBeVisible();
    await expect(preset12col).toBeVisible();

    // Default 3x3 preset should be active
    await expect(preset3x3).toHaveAttribute('aria-pressed', 'true');

    // Select 12col preset
    await preset12col.click();
    await expect(preset12col).toHaveAttribute('aria-pressed', 'true');
    await expect(preset3x3).toHaveAttribute('aria-pressed', 'false');

    // Columns slider should reflect 12 columns
    const columnsSlider = page.locator('#grid-columns');
    await expect(columnsSlider).toHaveValue('12');
  });

  test('should have explicit ARIA range properties and labels on controls', async ({ page }) => {
    const columnsSlider = page.locator('#grid-columns');
    await expect(columnsSlider).toHaveAttribute('aria-valuemin', '1');
    await expect(columnsSlider).toHaveAttribute('aria-valuemax', '12');
    await expect(columnsSlider).toHaveAttribute('aria-valuenow', '3');

    const rowsSlider = page.locator('#grid-rows');
    await expect(rowsSlider).toHaveAttribute('aria-valuemin', '1');
    await expect(rowsSlider).toHaveAttribute('aria-valuemax', '12');
    await expect(rowsSlider).toHaveAttribute('aria-valuenow', '3');

    const colGapSlider = page.locator('#column-gap');
    await expect(colGapSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(colGapSlider).toHaveAttribute('aria-valuemax', '100');
    await expect(colGapSlider).toHaveAttribute('aria-valuenow', '10');

    const rowGapSlider = page.locator('#row-gap');
    await expect(rowGapSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(rowGapSlider).toHaveAttribute('aria-valuemax', '100');
    await expect(rowGapSlider).toHaveAttribute('aria-valuenow', '10');
  });

  test('should reset configuration and return focus to columns slider when Escape is pressed', async ({ page }) => {
    const columnsSlider = page.locator('#grid-columns');
    await columnsSlider.fill('8');
    await expect(columnsSlider).toHaveValue('8');

    // Press Escape
    await page.keyboard.press('Escape');

    // Values should reset to default 3x3
    await expect(columnsSlider).toHaveValue('3');
    await expect(columnsSlider).toBeFocused();
  });

  test('should copy CSS code when C key is pressed while unfocused', async ({ page }) => {
    // Focus outside inputs
    await page.locator('body').click();

    // Press 'c'
    await page.keyboard.press('c');

    // Verify toast notification appears
    await expect(page.getByText('Code CSS Grid copié dans le presse-papiers !')).toBeVisible();
  });

  test('should display visual shortcut Kbd badges', async ({ page }) => {
    const escBadge = page.locator('button', { hasText: 'Réinitialiser' }).locator('kbd');
    await expect(escBadge).toBeVisible();
    await expect(escBadge).toHaveText('Esc');

    const copyBadge = page.locator('button[aria-label="Copier"]').locator('kbd');
    await expect(copyBadge).toBeVisible();
    await expect(copyBadge).toHaveText('C');
  });
});
