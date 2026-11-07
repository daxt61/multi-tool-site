import { test, expect } from '@playwright/test';

test.describe('Dog Age Converter Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Dog Age Converter
    await page.goto('http://localhost:5173/fr/outil/dog-age');
  });

  test('displays initial calculation and accessibility attributes', async ({ page }) => {
    const slider = page.locator('#dog-age');
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute('aria-valuenow', '1');
    await expect(slider).toHaveAttribute('aria-valuemin', '1');
    await expect(slider).toHaveAttribute('aria-valuemax', '20');

    // Medium size should be pressed by default
    const mediumBtn = page.getByRole('button', { name: 'Moyen 10-25kg' });
    await expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');

    // Default 1 year is 15 human years in aria-live region
    const humanAgeDisplay = page.locator('span[aria-live="polite"]');
    await expect(humanAgeDisplay).toHaveText('15');
  });

  test('applies presets with aria-pressed tracking and toast notification', async ({ page }) => {
    const seniorBtn = page.getByRole('button', { name: /Géant Âgé/i });
    await seniorBtn.click();

    // Verify preset is marked active
    await expect(seniorBtn).toHaveAttribute('aria-pressed', 'true');

    // Toast should show up
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();

    // Slider should be updated to 10
    const slider = page.locator('#dog-age');
    await expect(slider).toHaveAttribute('aria-valuenow', '10');

    // Size giant should be selected
    const giantBtn = page.getByRole('button', { name: 'Géant > 45kg' });
    await expect(giantBtn).toHaveAttribute('aria-pressed', 'true');

    // For 10 year giant dog: 24 + (10 - 2) * 7 = 24 + 56 = 80
    const humanAgeDisplay = page.locator('span[aria-live="polite"]');
    await expect(humanAgeDisplay).toHaveText('80');
  });

  test('clears active preset on manual slider or size interaction', async ({ page }) => {
    const puppyBtn = page.getByRole('button', { name: /Chiot/i });
    await puppyBtn.click();
    await expect(puppyBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch size to Grand manually
    const largeBtn = page.getByRole('button', { name: 'Grand 25-45kg' });
    await largeBtn.click();

    // Preset should no longer be pressed
    await expect(puppyBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(largeBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('copies human age on button click and keyboard shortcut C', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy button
    const copyBtn = page.getByRole('button', { name: 'Copier (C)' });
    await copyBtn.click();

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();

    // Press C
    await page.keyboard.press('c');
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  });

  test('resets to default and restores focus on Escape key', async ({ page }) => {
    // Select Young adult preset
    const youngAdultBtn = page.getByRole('button', { name: /Jeune Adulte/i });
    await youngAdultBtn.click();
    await expect(youngAdultBtn).toHaveAttribute('aria-pressed', 'true');

    // Press Escape
    await page.keyboard.press('Escape');

    // Preset is cleared, reset toast displayed
    await expect(youngAdultBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#dog-age')).toHaveAttribute('aria-valuenow', '1');
    await expect(page.locator('#dog-age')).toBeFocused();
  });
});
