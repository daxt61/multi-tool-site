import { test, expect } from '@playwright/test';

test('Word Counter UX improvements', async ({ page, baseURL }) => {
  await page.goto(`${baseURL || 'http://localhost:5173'}/fr/outil/word-counter`);

  const textarea = page.locator('#word-counter-input');

  // Test typing and statistics
  await textarea.fill('Hello world');
  await expect(page.getByText('11', { exact: true }).first()).toBeVisible(); // Characters
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();  // Words

  // Test Escape shortcut for clearing when textarea is focused
  await textarea.press('Escape');
  await expect(textarea).toHaveValue('');
  await expect(textarea).toBeFocused();

  // Test S shortcut for copying statistics (when not focused)
  await textarea.fill('Palette UX improvement');
  await page.keyboard.press('Tab'); // Move focus away from textarea
  await page.keyboard.press('s');

  // We can't easily check the clipboard in CI, but we can check if the button state changed
  // The button text should change to "Copié"
  await expect(page.getByText('Copié')).toBeVisible();

  // Test global Escape shortcut for clearing
  await page.keyboard.press('Escape');
  await expect(textarea).toHaveValue('');
  await expect(textarea).toBeFocused();
});
