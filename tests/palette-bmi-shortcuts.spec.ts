import { test, expect } from '@playwright/test';

test.describe('BMI Calculator Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/bmi-calculator');
  });

  test('should clear inputs and focus weight when Escape is pressed', async ({ page }) => {
    const weightInput = page.locator('#weight');
    const heightInput = page.locator('#height');

    await weightInput.fill('85');
    await heightInput.fill('185');

    await weightInput.focus();
    await page.keyboard.press('Escape');

    await expect(weightInput).toHaveValue('');
    await expect(heightInput).toHaveValue('');
    await expect(weightInput).toBeFocused();
  });

  test('should toggle units when S is pressed', async ({ page }) => {
    const metricButton = page.getByRole('button', { name: 'Métrique' });
    const imperialButton = page.getByRole('button', { name: 'Impérial' });

    await expect(metricButton).toHaveAttribute('aria-pressed', 'true');

    // Focus away from input to trigger global shortcut
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('s');

    await expect(imperialButton).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('S');
    await expect(metricButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should copy result when C is pressed', async ({ page }) => {
    // Fill values to get a result
    await page.locator('#weight').fill('70');
    await page.locator('#height').fill('170');

    // Wait for result to be visible
    await expect(page.locator('.text-6xl')).toHaveText('24.2');

    // Focus away from inputs to trigger global shortcut
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press C
    await page.keyboard.press('c');

    // Check for success feedback (Check icon instead of Copy icon)
    // The button has absolute top-6 right-6 inside the result card
    const copyButton = page.locator('button[aria-label="Copier le résultat"]');
    await expect(copyButton).toBeVisible();

    // After pressing C, it should show the Check icon
    await expect(copyButton.locator('svg')).toHaveClass(/lucide-check/);
  });

  test('should show keyboard shortcut hints', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^S$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });
});
