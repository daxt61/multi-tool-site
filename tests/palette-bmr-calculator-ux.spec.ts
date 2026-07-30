import { test, expect } from '@playwright/test';

test.describe('BMR and TDEE Calculator Premium UX & Accessibility', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/fr/outil/bmr-calculator`);
  });

  test('should display accessible groups and standard label-input associations', async ({ page }) => {
    // 1. Verify Gender choice is marked with radiogroup role
    const genderGroup = page.getByRole('radiogroup', { name: /genre/i });
    await expect(genderGroup).toBeVisible();

    const maleRadio = genderGroup.getByRole('radio', { name: /homme/i });
    await expect(maleRadio).toBeVisible();
    await expect(maleRadio).toHaveAttribute('aria-checked', 'true');

    const femaleRadio = genderGroup.getByRole('radio', { name: /femme/i });
    await expect(femaleRadio).toBeVisible();
    await expect(femaleRadio).toHaveAttribute('aria-checked', 'false');

    // 2. Click "Femme" and verify state update
    await femaleRadio.click();
    await expect(maleRadio).toHaveAttribute('aria-checked', 'false');
    await expect(femaleRadio).toHaveAttribute('aria-checked', 'true');

    // 3. Verify label-to-input association for Age
    const ageInput = page.getByLabel(/Âge/i);
    await expect(ageInput).toBeVisible();
    await ageInput.fill('30');

    // 4. Verify label-to-input association for Poids
    const weightInput = page.getByLabel(/Poids/i);
    await expect(weightInput).toBeVisible();
    await weightInput.fill('75');

    // 5. Verify label-to-input association for Taille
    const heightInput = page.getByLabel(/Taille/i);
    await expect(heightInput).toBeVisible();
    await heightInput.fill('180');

    // 6. Verify maintenance calories are calculated and updated
    const resultDisplay = page.locator('div:has-text("Maintien du poids")').last();
    await expect(resultDisplay).toBeVisible();
  });

  test('should support keyboard shortcuts (Escape to reset and focus, C to copy)', async ({ page }) => {
    const ageInput = page.getByLabel(/Âge/i);
    await ageInput.focus();
    await ageInput.fill('30');

    const weightInput = page.getByLabel(/Poids/i);
    await weightInput.focus();
    await weightInput.fill('75');

    const heightInput = page.getByLabel(/Taille/i);
    await heightInput.focus();
    await heightInput.fill('180');

    // Tab out so no input has focus
    await page.keyboard.press('Tab');

    // Press 'C' to copy estimated Maintenance TDEE value
    await page.keyboard.press('c');

    // Verify copy toast notification
    const toast = page.locator('li[data-sonner-toast]');
    await expect(toast.last()).toBeVisible();

    // Press Escape to reset inputs and restore focus to Age input
    await page.keyboard.press('Escape');

    // Inputs should be empty
    await expect(ageInput).toHaveValue('');
    await expect(weightInput).toHaveValue('');
    await expect(heightInput).toHaveValue('');

    // Focus must be returned to Age input
    await expect(ageInput).toBeFocused();
  });
});
