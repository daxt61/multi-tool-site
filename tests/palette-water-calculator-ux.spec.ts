import { test, expect } from '@playwright/test';

test.describe('Water Calculator Keyboard Shortcuts and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Go to French path for the tool
    await page.goto('http://localhost:5173/fr/outil/water-calculator');
  });

  test('should clear inputs and focus weight when Escape is pressed', async ({ page }) => {
    const weightInput = page.locator('#weight');

    await weightInput.fill('85');

    await weightInput.focus();
    await page.keyboard.press('Escape');

    await expect(weightInput).toHaveValue('');
    await expect(weightInput).toBeFocused();
  });

  test('should copy result when C is pressed', async ({ page }) => {
    const weightInput = page.locator('#weight');
    await weightInput.fill('70');

    // Expected needs: 70 * 35 + 500 (moderate) = 2950 => 2.95
    await expect(page.locator('.text-6xl')).toHaveText('2.95');

    // Blur from input to allow global shortcut
    await weightInput.blur();

    // Press C
    await page.keyboard.press('c');

    // Check for success feedback (Check icon instead of Copy icon)
    const copyButton = page.locator('button[aria-label="Copier (C)"]');
    await expect(copyButton).toBeVisible();

    // After pressing C, it should show the Check icon
    await expect(copyButton.locator('svg')).toHaveClass(/lucide-check/);
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });

  test('should display hydration presets with aria-pressed and apply them', async ({ page }) => {
    const fitnessPreset = page.getByRole('button', { name: /Fitness/i });
    await expect(fitnessPreset).toBeVisible();
    await expect(fitnessPreset).toHaveAttribute('aria-pressed', 'false');

    await fitnessPreset.click();
    await expect(fitnessPreset).toHaveAttribute('aria-pressed', 'true');

    // Fitness preset: 80 kg, active (+700ml): 80 * 35 + 700 = 3500 => 3.50 L
    const weightInput = page.locator('#weight');
    await expect(weightInput).toHaveValue('80');
    await expect(weightInput).toBeFocused();
    await expect(page.locator('.text-6xl')).toHaveText('3.50');

    // Toast notification check
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();

    // Selecting another preset updates aria-pressed and calculation
    const officePreset = page.getByRole('button', { name: /bureau|office/i });
    await officePreset.click();
    await expect(officePreset).toHaveAttribute('aria-pressed', 'true');
    await expect(fitnessPreset).toHaveAttribute('aria-pressed', 'false');
    // Office preset: 70 kg, sedentary (+0ml): 70 * 35 = 2450 => 2.45 L
    await expect(weightInput).toHaveValue('70');
    await expect(page.locator('.text-6xl')).toHaveText('2.45');

    // Modifying weight manually resets active preset tracking
    await weightInput.fill('72');
    await expect(officePreset).toHaveAttribute('aria-pressed', 'false');
  });
});
