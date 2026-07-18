import { test, expect } from '@playwright/test';

test.describe('CSS Clip Path Generator E2E tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the clip-path tool path in French
    await page.goto('http://localhost:5173/fr/outil/css-clippath');
  });

  test('should display initial polygon shape successfully', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText('Générateur Clip Path');

    // Confirm canvas container and interaction canvas are present
    const svg = page.locator('svg[aria-label="Interactive clip path editor"]');
    await expect(svg).toBeVisible();

    // Check default preview coordinates in the vertices inputs
    const vertex1X = page.locator('#pt-0-x');
    await expect(vertex1X).toBeVisible();
    await expect(vertex1X).toHaveValue('50');

    const vertex1Y = page.locator('#pt-0-y');
    await expect(vertex1Y).toBeVisible();
    await expect(vertex1Y).toHaveValue('0');
  });

  test('should update outputs when switching to circle preset', async ({ page }) => {
    // Select the Circle preset button
    const circlePresetBtn = page.getByRole('button', { name: 'CERCLE' }).first();
    await expect(circlePresetBtn).toBeVisible();
    await circlePresetBtn.click();

    // Verify coordinates fields of circle shape
    const radiusLabel = page.getByText('Rayon');
    await expect(radiusLabel).toBeVisible();

    // Verify clip-path CSS output contains circle()
    const cssCode = page.locator('textarea[aria-label="Generated CSS code"]');
    await expect(cssCode).toContainText('circle(');
  });

  test('should copy CSS code when pressing C key', async ({ page }) => {
    // Set a custom background color
    const colorInput = page.locator('#bg-color');
    await expect(colorInput).toBeVisible();

    // Focus off fields and hit "C" key to copy
    await page.keyboard.press('c');

    // Clipboard copy should trigger success toast notification via Sonner
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();
  });
});
