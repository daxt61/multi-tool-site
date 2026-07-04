import { test, expect } from '@playwright/test';

test.describe('New OnlineTools Inspired Tools Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en');
  });

  test('Fraction Calculator works', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/fraction-calculator');

    // Default 1/2 + 1/4 = 3/4 (0.75)
    await expect(page.locator('text=3')).toBeVisible();
    await expect(page.locator('text=4')).toBeVisible();
    await expect(page.locator('text=0.75')).toBeVisible();
  });

  test('Phone Extractor works', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/phone-extractor');

    const input = page.locator('textarea');
    await input.fill('Call me at +1 234 567 8900 or (555) 123-4567.');

    await expect(page.locator('span.font-mono:has-text("+1 234 567 8900")')).toBeVisible();
    await expect(page.locator('span.font-mono:has-text("(555) 123-4567")')).toBeVisible();
    await expect(page.locator('text=2 numbers found')).toBeVisible();
  });

  test('Hashtag Extractor works', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/hashtag-extractor');

    const input = page.locator('textarea');
    await input.fill('Learning #coding with #WebTools! #Happy2024');

    await expect(page.getByRole('button', { name: '#coding', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '#WebTools', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '#Happy2024', exact: true })).toBeVisible();
  });

  test('Emoji Extractor works', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/emoji-extractor');

    const input = page.locator('textarea');
    await input.fill('Hello! 🚀 Ready for 2024? ✨ Let\'s go! 🔥');

    await expect(page.getByRole('button', { name: '🚀' })).toBeVisible();
    await expect(page.getByRole('button', { name: '✨' })).toBeVisible();
    await expect(page.getByRole('button', { name: '🔥' })).toBeVisible();
    await expect(page.locator('text=3 emojis found')).toBeVisible();
  });
});
