import { test, expect } from '@playwright/test';

test('JSON Analyzer UX improvements', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-analyzer');

  const textarea = page.locator('#json-input');

  // 1. Test typing and statistics
  await textarea.fill('{"a": 1, "b": "test", "c": true, "d": null}');

  // Check key count (should be 4)
  await expect(page.getByText('4', { exact: true }).first()).toBeVisible();

  // 2. Test 'C' shortcut for copying stats (when not focused)
  await page.keyboard.press('Tab'); // Move focus away from textarea
  await page.keyboard.press('c');

  // The button text should change to "Copié"
  await expect(page.getByText('Copié')).toBeVisible();

  // 3. Test Escape shortcut for clearing
  await page.keyboard.press('Escape');
  await expect(textarea).toHaveValue('');
  await expect(textarea).toBeFocused();
});
