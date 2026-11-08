import { test, expect } from '@playwright/test';

test.describe('Fraction Calculator Palette Micro-UX & Accessibility Suite', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('should display default preset active state and load alternative presets with aria-pressed', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/fraction-calculator');
    await page.waitForSelector('#num1');

    const defaultPreset = page.getByRole('button', { name: 'Half + Quarter' });
    await expect(defaultPreset).toBeVisible();
    await expect(defaultPreset).toHaveAttribute('aria-pressed', 'true');

    // Switch to multiply preset
    const multiplyPreset = page.getByRole('button', { name: '2/3 × 3/5' });
    await expect(multiplyPreset).toBeVisible();
    await expect(multiplyPreset).toHaveAttribute('aria-pressed', 'false');

    await multiplyPreset.click();
    await expect(multiplyPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(defaultPreset).toHaveAttribute('aria-pressed', 'false');

    await expect(page.locator('#num1')).toHaveValue('2');
    await expect(page.locator('#den1')).toHaveValue('3');
    await expect(page.locator('#num2')).toHaveValue('3');
    await expect(page.locator('#den2')).toHaveValue('5');

    // 2/3 * 3/5 = 6/15 = 2/5 (0.4)
    await expect(page.locator('text=0.4')).toBeVisible();
  });

  test('should clear active preset selection when inputs or operators are manually changed', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/fraction-calculator');
    await page.waitForSelector('#num1');

    const defaultPreset = page.getByRole('button', { name: 'Half + Quarter' });
    await expect(defaultPreset).toHaveAttribute('aria-pressed', 'true');

    // Edit numerator 1
    await page.locator('#num1').fill('3');
    await expect(defaultPreset).toHaveAttribute('aria-pressed', 'false');

    // Re-apply preset
    await defaultPreset.click();
    await expect(defaultPreset).toHaveAttribute('aria-pressed', 'true');

    // Change operator to minus
    const minusBtn = page.getByRole('button', { name: 'Subtraction (-)' });
    await minusBtn.click();
    await expect(defaultPreset).toHaveAttribute('aria-pressed', 'false');
  });

  test('should reset inputs and restore focus to #num1 via Escape shortcut', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/fraction-calculator');
    await page.waitForSelector('#num1');

    // Fill non-default values
    await page.locator('#num1').fill('7');
    await page.locator('#den1').fill('8');

    // Focus inside container and hit Escape
    await page.locator('#num1').focus();
    await page.keyboard.press('Escape');

    // Expect reset to default values and focus returned to #num1
    await expect(page.locator('#num1')).toHaveValue('1');
    await expect(page.locator('#den1')).toHaveValue('2');
    await expect(page.locator('#num1')).toBeFocused();
  });

  test('should copy calculation summary via Copy button and C key when unfocused', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/fraction-calculator');
    await page.waitForSelector('#num1');

    const copyBtn = page.locator('button[aria-label="Copy (C)"]');
    await expect(copyBtn).toBeVisible();

    await copyBtn.click();
    await expect(page.locator('button[aria-label="Copied (C)"]')).toBeVisible();

    // Wait for check status to settle or test 'c' hotkey
    await page.waitForTimeout(2100);
    await expect(page.locator('button[aria-label="Copy (C)"]')).toBeVisible();

    // Blur active element to test container-isolated 'c' shortcut
    await page.locator('#num1').blur();
    await page.keyboard.press('c');
    await expect(page.locator('button[aria-label="Copied (C)"]')).toBeVisible();
  });

  test('should have proper accessible names and ARIA attributes for inputs and operators', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/fraction-calculator');
    await page.waitForSelector('#num1');

    await expect(page.locator('#num1')).toHaveAttribute('aria-label', 'Numerator 1');
    await expect(page.locator('#den1')).toHaveAttribute('aria-label', 'Denominator 1');
    await expect(page.locator('#num2')).toHaveAttribute('aria-label', 'Numerator 2');
    await expect(page.locator('#den2')).toHaveAttribute('aria-label', 'Denominator 2');

    const addBtn = page.getByRole('button', { name: 'Addition (+)' });
    await expect(addBtn).toHaveAttribute('aria-pressed', 'true');

    const divBtn = page.getByRole('button', { name: 'Division (÷)' });
    await expect(divBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
