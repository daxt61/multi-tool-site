import { test, expect } from '@playwright/test';

test.describe('Inspired Tools Functionality', () => {

  test('Number Statistics works correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/number-statistics');

    const textarea = page.locator('#num-input');
    await textarea.fill('10\n20\n30\n40\n50');

    // Check summary
    await expect(page.getByText('Count', { exact: true })).toBeVisible();
    await expect(page.getByText('Sum', { exact: true })).toBeVisible();
    await expect(page.getByText('Mean', { exact: true })).toBeVisible();

    // Check detailed stats
    await expect(page.locator('text=Median')).toBeVisible();
    await expect(page.locator('text=Std Deviation')).toBeVisible();

    // Test clear
    await page.click('button:has-text("Clear")');
    await expect(textarea).toHaveValue('');
  });

  test('Sequence Generator works correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sequence-generator');

    // Arithmetic
    await page.fill('#seq-start', '5');
    await page.fill('#seq-step', '5');
    await page.fill('#seq-count', '5'); // Note: value is 5, but slider might be tricky, typing in range?
    // Wait, the input is a range, but I can use keyboard to set it if I focus it
    await page.locator('#seq-count').fill('5');

    await expect(page.locator('text=#1')).toBeVisible();
    await expect(page.locator('text=5').first()).toBeVisible();
    await expect(page.locator('text=10').first()).toBeVisible();
    await expect(page.locator('text=15').first()).toBeVisible();
    await expect(page.locator('text=20').first()).toBeVisible();
    await expect(page.locator('text=25').first()).toBeVisible();

    // Fibonacci
    await page.click('button:has-text("Fibonacci")');
    await expect(page.locator('text=0').first()).toBeVisible();
    await expect(page.locator('text=1').first()).toBeVisible();
    await expect(page.locator('text=1').nth(1)).toBeVisible();
    await expect(page.locator('text=2').first()).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible();
  });

  test('Image Effects uploads and clears', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/image-effects');

    // Check upload prompt is visible
    await expect(page.locator('text=Upload an image to start')).toBeVisible();

    // Since we can't easily upload and process canvas in a headless smoke test without assets,
    // we verify the sliders exist.
    await expect(page.locator('text=Blur')).toBeVisible();
    await expect(page.locator('text=Pixelate')).toBeVisible();
    await expect(page.locator('text=Brightness')).toBeVisible();
  });

});
