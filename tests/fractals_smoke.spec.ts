import { test, expect } from '@playwright/test';

test.describe('New Fractal Tools Smoke Test', () => {
  test('Dragon Curve is functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/dragon-curve');

    // Check if the SVG path is present (target the one in the preview area)
    const path = page.locator('.min-h-\\[500px\\] svg > path').first();
    await expect(path).toBeVisible();

    // Change iterations
    const slider = page.locator('#dragon-iterations');
    await slider.fill('5');

    // Check if path data updated (implicitly)
    await expect(path).toBeVisible();
  });

  test('Pythagoras Tree is functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/pythagoras-tree');

    // Check if the canvas is present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Change depth
    const slider = page.locator('#tree-depth');
    await slider.fill('5');

    await expect(canvas).toBeVisible();
  });

  test('New tools are visible on dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/en');
    await expect(page.locator('h4:has-text("Dragon Curve")')).toBeVisible();
    await expect(page.locator('h4:has-text("Pythagoras Tree")')).toBeVisible();
  });
});
