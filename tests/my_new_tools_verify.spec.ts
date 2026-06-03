import { test, expect } from '@playwright/test';

test.describe('New Tools Verification', () => {
  test('List to Tree tool should be functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-to-tree');
    await expect(page.locator('h1')).toContainText('List to Tree');

    const input = page.locator('#list-input');
    await input.fill('src/app.tsx\nsrc/components/ui/button.tsx');

    const output = page.locator('#tree-output');
    await expect(output).toContainText('src');
    await expect(output).toContainText('├── app.tsx');
    await expect(output).toContainText('└── components');
    await expect(output).toContainText('        └── button.tsx');
  });

  test('Screen Recorder tool should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/screen-recorder');
    await expect(page.locator('h1')).toContainText('Screen Recorder');
    await expect(page.locator('button', { hasText: 'Start Recording' })).toBeVisible();
  });

  test('Morse Code Converter should have audio play button and localized labels', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/morse-code');
    await expect(page.locator('label', { hasText: 'Normal Text' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Play' })).toBeVisible();

    await page.locator('#normal-text').fill('SOS');
    await expect(page.locator('#morse-text')).toHaveValue('... --- ...');
  });
});
