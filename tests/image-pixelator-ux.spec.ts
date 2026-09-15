import { test, expect } from '@playwright/test';

test.describe('Image Pixelator Tool E2E & Palette UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/image-pixelator');
    await page.waitForLoadState('networkidle');
  });

  test('renders tool header, title, controls, presets, and live preview canvas', async ({ page }) => {
    // Check heading and title
    await expect(page.locator('h1')).toContainText('Pixeliser une Image');

    // Check presets are visible
    await expect(page.getByRole('button', { name: 'Subtle Pixelation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retro 8-Bit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Heavy Anonymize' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mosaic Art' })).toBeVisible();

    // Check pixel size slider and label
    const slider = page.locator('#pixel-size-slider');
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute('aria-valuemin', '2');
    await expect(slider).toHaveAttribute('aria-valuemax', '100');

    // Check canvas element is present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('interacts with quick presets and updates block size slider', async ({ page }) => {
    const slider = page.locator('#pixel-size-slider');

    // Click 'Mosaic Art' preset (50px)
    const mosaicBtn = page.getByRole('button', { name: 'Mosaic Art' });
    await mosaicBtn.click();
    await expect(mosaicBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(slider).toHaveValue('50');

    // Click 'Subtle Pixelation' preset (4px)
    const subtleBtn = page.getByRole('button', { name: 'Subtle Pixelation' });
    await subtleBtn.click();
    await expect(subtleBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(slider).toHaveValue('4');
  });

  test('resets settings and restores focus to slider', async ({ page }) => {
    const slider = page.locator('#pixel-size-slider');

    // Change value
    await slider.fill('42');
    await expect(slider).toHaveValue('42');

    // Click reset button by title
    const resetBtn = page.locator('button[title*="Reset"]');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify reset to default (12px) and focus restored
    await expect(slider).toHaveValue('12');
    await expect(slider).toBeFocused();
  });

  test('triggers copy Data URL and shows Sonner toast', async ({ page }) => {
    const copyBtn = page.getByRole('button', { name: /Data URL/i });
    await copyBtn.click();

    // Verify toast notification appears
    await expect(page.getByText(/copié dans le presse-papiers/i)).toBeVisible();
  });
});
