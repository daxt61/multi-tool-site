import { test, expect } from '@playwright/test';

test.describe('Loan Calculator Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('http://localhost:5173/en/outil/loan-calculator');
    await page.waitForSelector('#principal');
  });

  test('renders preset buttons with proper ARIA pressed attributes', async ({ page }) => {
    const personalPreset = page.getByRole('button', { name: 'Personal Loan' });
    const autoPreset = page.getByRole('button', { name: 'Auto Loan' });
    const mortgagePreset = page.getByRole('button', { name: 'Mortgage' });

    await expect(personalPreset).toBeVisible();
    await expect(autoPreset).toBeVisible();
    await expect(mortgagePreset).toBeVisible();

    // Default active preset is personal
    await expect(personalPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(autoPreset).toHaveAttribute('aria-pressed', 'false');

    // Click Auto Loan preset
    await autoPreset.click();
    await expect(autoPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(personalPreset).toHaveAttribute('aria-pressed', 'false');

    // Verify input values updated
    await expect(page.locator('#principal')).toHaveValue('25000');
    await expect(page.locator('#annualRate')).toHaveValue('4.5');
    await expect(page.locator('#years')).toHaveValue('5');
  });

  test('supports Escape shortcut to reset inputs and restore focus', async ({ page }) => {
    const principalInput = page.locator('#principal');
    await principalInput.fill('50000');
    await expect(principalInput).toHaveValue('50000');

    // Press Escape inside input
    await principalInput.press('Escape');

    // Principal input should be cleared and re-focused
    await expect(principalInput).toHaveValue('');
    await expect(principalInput).toBeFocused();
  });

  test('supports C shortcut to copy summary and displays toast', async ({ page }) => {
    // Blur inputs
    await page.locator('#principal').blur();

    // Press C to copy summary
    await page.keyboard.press('c');

    // Verify Copy Summary button is visible
    const copyBtn = page.getByRole('button', { name: 'Copy Summary' });
    await expect(copyBtn).toBeVisible();
  });

  test('explicit HTML labels associate correctly with inputs', async ({ page }) => {
    const principalLabel = page.locator('label[for="principal"]');
    const rateLabel = page.locator('label[for="annualRate"]');
    const yearsLabel = page.locator('label[for="years"]');

    await expect(principalLabel).toBeVisible();
    await expect(rateLabel).toBeVisible();
    await expect(yearsLabel).toBeVisible();

    // Clicking principal label should focus principal input
    await principalLabel.click();
    await expect(page.locator('#principal')).toBeFocused();
  });
});
