import { test, expect } from '@playwright/test';

test.describe('FIRE Calculator Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('http://localhost:5173/en/outil/fire-calculator');
    await page.waitForSelector('#currentSavings');
  });

  test('renders preset buttons with proper ARIA pressed attributes', async ({ page }) => {
    const leanPreset = page.getByRole('button', { name: 'Lean FIRE' });
    const standardPreset = page.getByRole('button', { name: 'Standard FIRE' });
    const fatPreset = page.getByRole('button', { name: 'Fat FIRE' });
    const coastPreset = page.getByRole('button', { name: 'Coast / High Savings' });

    await expect(leanPreset).toBeVisible();
    await expect(standardPreset).toBeVisible();
    await expect(fatPreset).toBeVisible();
    await expect(coastPreset).toBeVisible();

    // Default active preset is standard
    await expect(standardPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(leanPreset).toHaveAttribute('aria-pressed', 'false');

    // Click Lean FIRE preset
    await leanPreset.click();
    await expect(leanPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(standardPreset).toHaveAttribute('aria-pressed', 'false');

    // Verify input values updated
    await expect(page.locator('#currentSavings')).toHaveValue('20000');
    await expect(page.locator('#monthlySavings')).toHaveValue('1500');
    await expect(page.locator('#annualSpending')).toHaveValue('24000');
  });

  test('clears active preset attribute when inputs are manually modified', async ({ page }) => {
    const standardPreset = page.getByRole('button', { name: 'Standard FIRE' });
    await expect(standardPreset).toHaveAttribute('aria-pressed', 'true');

    // Manually edit current savings input
    const savingsInput = page.locator('#currentSavings');
    await savingsInput.fill('60000');

    // Preset button should no longer be marked aria-pressed="true"
    await expect(standardPreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('supports Escape shortcut to reset inputs and restore focus', async ({ page }) => {
    const savingsInput = page.locator('#currentSavings');
    await savingsInput.fill('75000');
    await expect(savingsInput).toHaveValue('75000');

    // Press Escape
    await savingsInput.press('Escape');

    // Input should reset to standard default (50000) and focus returned to #currentSavings
    await expect(savingsInput).toHaveValue('50000');
    await expect(savingsInput).toBeFocused();
  });

  test('supports C shortcut to copy summary and displays toast', async ({ page }) => {
    // Blur inputs
    await page.locator('#currentSavings').blur();

    // Press C to copy summary
    await page.keyboard.press('c');

    // Verify Copy Summary button is visible
    const copyBtn = page.getByRole('button', { name: 'Copy Summary' });
    await expect(copyBtn).toBeVisible();
  });

  test('explicit HTML labels associate correctly with inputs', async ({ page }) => {
    const savingsLabel = page.locator('label[for="currentSavings"]');
    const monthlyLabel = page.locator('label[for="monthlySavings"]');
    const annualLabel = page.locator('label[for="annualSpending"]');
    const returnLabel = page.locator('label[for="expectedReturn"]');

    await expect(savingsLabel).toBeVisible();
    await expect(monthlyLabel).toBeVisible();
    await expect(annualLabel).toBeVisible();
    await expect(returnLabel).toBeVisible();

    // Clicking label should focus associated input
    await savingsLabel.click();
    await expect(page.locator('#currentSavings')).toBeFocused();
  });
});
