import { test, expect } from '@playwright/test';

test.describe('Dashboard and New Tools Smoke Test', () => {
  test('Dashboard shows new tools', async ({ page }) => {
    await page.goto('http://localhost:5173/en');
    await expect(page.locator('h4:has-text("Julia Set")')).toBeVisible();
    await expect(page.locator('h4:has-text("Duplicate Finder")')).toBeVisible();
    await expect(page.locator('h4:has-text("Image Border")')).toBeVisible();
  });

  test('Julia Set tool basic interaction', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/julia-set');
    await expect(page.locator('h1')).toContainText('Julia Set');
    await expect(page.locator('canvas')).toBeVisible();
    // Check if controls exist
    await expect(page.locator('text=Re(c)')).toBeVisible();
    await expect(page.locator('text=Im(c)')).toBeVisible();
  });

  test('Duplicate Finder tool basic interaction', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/duplicate-finder');
    await expect(page.locator('h1')).toContainText('Duplicate Finder');

    const input = page.locator('#duplicate-input');
    await input.fill('test\ntest\nunique');

    // Total lines should be 3
    await expect(page.locator('div.text-2xl').first()).toHaveText('3');
    // Duplicates should be 1
    // The "Duplicates" card is the second one with text-2xl
    await expect(page.locator('div.text-2xl').nth(1)).toHaveText('1');

    await page.click('button:has-text("Remove Duplicates")');
    // Result should be test and unique
    await expect(async () => {
        const val = await input.inputValue();
        expect(val.split('\n')).toContain('test');
        expect(val.split('\n')).toContain('unique');
    }).toPass();
  });

  test('Image Border tool basic interaction', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/image-border');
    await expect(page.locator('h1')).toContainText('Image Border');
    await expect(page.locator('text=Click to upload an image')).toBeVisible();
  });

  test('Word Counter platform limits upgrade', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/word-counter');
    await expect(page.locator('text=Mastodon')).toBeVisible();
    await expect(page.locator('text=Threads')).toBeVisible();
    await expect(page.locator('text=Discord')).toBeVisible();
  });
});
