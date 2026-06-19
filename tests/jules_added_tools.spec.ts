import { test, expect } from '@playwright/test';

test.describe('New Tools Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en');
    await page.waitForLoadState('networkidle');
  });

  test('Game of Life is accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/game-of-life');
    await expect(page.locator('h1')).toContainText('Game of Life');

    // Check if grid exists
    const cells = page.locator('button[aria-label^="Cell"]');
    await expect(cells).toHaveCount(1200); // 40 * 30
  });

  test('Password Analyzer works correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/password-analyzer');

    const input = page.locator('input#pwd-analyzer');
    await input.fill('weak');
    // Use a more specific selector to avoid ambiguity
    await expect(page.locator('div').filter({ hasText: /^Weak$/ }).first()).toBeVisible();

    await input.fill('VeryStrongPassword123!@#LongEnough');
    await expect(page.locator('div').filter({ hasText: /^Strong$/ }).first()).toBeVisible();
  });

  test('Reaction Time Tester is accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/reaction-time');

    const gameArea = page.getByRole('button', { name: 'Reaction Time Test' });
    await expect(gameArea).toBeVisible();
  });

  test('Diff Checker supports character level', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/diff-checker');

    await page.fill('textarea#text1', 'Hello World');
    await page.fill('textarea#text2', 'Hello there World');

    // Check for the '+' sign in the result area
    await expect(page.locator('span').filter({ hasText: '+' }).first()).toBeVisible();
    // Character level highlight check - targeting the specific span with background class
    const highlighted = page.locator('span.bg-emerald-200, span.dark\\:bg-emerald-500\\/30');
    await expect(highlighted).toContainText('there');
  });
});
