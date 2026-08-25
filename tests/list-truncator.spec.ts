import { test, expect } from '@playwright/test';

test.describe('List Truncator & Line Limiter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/list-truncator');
    await page.waitForSelector('[data-testid="list-truncator-container"]');
  });

  test('renders correctly with default controls', async ({ page }) => {
    await expect(page.locator('#list-truncator-input')).toBeVisible();
    await expect(page.locator('#list-truncator-output')).toBeVisible();
    await expect(page.locator('#max-chars-input')).toBeVisible();
  });

  test('truncates line length by max characters and ellipsis', async ({ page }) => {
    const inputArea = page.locator('#list-truncator-input');
    await inputArea.fill('Short line\nThis is a very long line that exceeds character limit');

    const maxCharsInput = page.locator('#max-chars-input');
    await maxCharsInput.fill('20');

    const outputArea = page.locator('#list-truncator-output');
    await expect(outputArea).toHaveValue('Short line\nThis is a very lo...');
  });

  test('limits total line count in line mode', async ({ page }) => {
    await page.click('button:has-text("Par Nombre Total de Lignes")');

    const inputArea = page.locator('#list-truncator-input');
    await inputArea.fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6');

    const maxLinesInput = page.locator('#max-lines-input');
    await maxLinesInput.fill('3');

    const outputArea = page.locator('#list-truncator-output');
    await expect(outputArea).toHaveValue('Line 1\nLine 2\nLine 3');
  });

  test('loads presets correctly', async ({ page }) => {
    await page.click('button:has-text("Raccourcir les Titres")');
    const inputArea = page.locator('#list-truncator-input');
    await expect(inputArea).toHaveValue(/Understanding the Modern Web Ecosystem/);
  });

  test('clears inputs and restores focus on Escape key', async ({ page }) => {
    const inputArea = page.locator('#list-truncator-input');
    await inputArea.fill('Test line 123');
    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
