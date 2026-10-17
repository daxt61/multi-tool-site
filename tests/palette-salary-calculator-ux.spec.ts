import { test, expect } from '@playwright/test';

test.describe('Salary Calculator Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('renders preset buttons with proper ARIA pressed attributes in English and French', async ({ page }) => {
    // Test French locale
    await page.goto('http://localhost:5173/fr/outil/salary-calculator');
    await page.waitForSelector('#gross-salary');

    const frSmic = page.getByRole('button', { name: 'SMIC (Minimum)' });
    const frJunior = page.getByRole('button', { name: 'Jeune Cadre' });
    const frSenior = page.getByRole('button', { name: 'Cadre Confirmé' });
    const frExec = page.getByRole('button', { name: 'Directeur / Exec' });

    await expect(frSmic).toBeVisible();
    await expect(frJunior).toBeVisible();
    await expect(frSenior).toBeVisible();
    await expect(frExec).toBeVisible();

    // Default active preset is false
    await expect(frSmic).toHaveAttribute('aria-pressed', 'false');

    // Click SMIC preset
    await frSmic.click();
    await expect(frSmic).toHaveAttribute('aria-pressed', 'true');
    await expect(frJunior).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#gross-salary')).toHaveValue('21203');

    // Test English locale
    await page.goto('http://localhost:5173/en/outil/salary-calculator');
    await page.waitForSelector('#gross-salary');

    const enSmic = page.getByRole('button', { name: 'SMIC (Min Wage)' });
    const enExec = page.getByRole('button', { name: 'Executive Lead' });

    await expect(enSmic).toBeVisible();
    await expect(enExec).toBeVisible();

    await enExec.click();
    await expect(enExec).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#gross-salary')).toHaveValue('85000');
  });

  test('clears active preset selection when gross salary is edited manually', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/salary-calculator');
    await page.waitForSelector('#gross-salary');

    const smicPreset = page.getByRole('button', { name: 'SMIC (Minimum)' });
    await smicPreset.click();
    await expect(smicPreset).toHaveAttribute('aria-pressed', 'true');

    // Edit input manually
    const grossSalaryInput = page.locator('#gross-salary');
    await grossSalaryInput.fill('45000');

    // Preset active state should be reset to false
    await expect(smicPreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('supports Escape shortcut to reset inputs and restore focus', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/salary-calculator');
    await page.waitForSelector('#gross-salary');

    const grossSalaryInput = page.locator('#gross-salary');
    await grossSalaryInput.fill('50000');
    await expect(grossSalaryInput).toHaveValue('50000');

    // Press Escape inside input
    await grossSalaryInput.press('Escape');

    // Input should be cleared and re-focused
    await expect(grossSalaryInput).toHaveValue('');
    await expect(grossSalaryInput).toBeFocused();
  });

  test('supports C shortcut to copy summary', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/salary-calculator');
    await page.waitForSelector('#gross-salary');

    // Blur inputs by clicking heading
    await page.locator('h3').first().click();

    // Press C to copy summary
    await page.keyboard.press('c');

    // Verify Copy button is visible
    const copyBtn = page.getByRole('button', { name: 'Copier le résultat' });
    await expect(copyBtn).toBeVisible();
  });

  test('explicit HTML labels associate correctly with inputs', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/salary-calculator');
    await page.waitForSelector('#gross-salary');

    const grossSalaryLabel = page.locator('label[for="gross-salary"]');
    const mealVouchersLabel = page.locator('label[for="meal-vouchers"]');
    const benefitsLabel = page.locator('label[for="benefits"]');

    await expect(grossSalaryLabel).toBeVisible();
    await expect(mealVouchersLabel).toBeVisible();
    await expect(benefitsLabel).toBeVisible();

    // Clicking gross salary label should focus gross salary input
    await grossSalaryLabel.click();
    await expect(page.locator('#gross-salary')).toBeFocused();
  });
});
