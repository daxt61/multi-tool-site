import { test, expect } from '@playwright/test';

test('verify RegexBuilder functionalities', async ({ page }) => {
  // Navigation to the Regex Builder tool path
  await page.goto('http://localhost:5173/fr/outil/regex-builder');

  // Verify compiled expression display
  const expressionDisplay = page.locator('div.font-mono').first();
  await expect(expressionDisplay).toBeVisible();

  // The default expression starts as /^[a-zA-Z]+\d{3}$/gi (with default global & caseInsensitive flags)
  const defaultText = await expressionDisplay.textContent();
  expect(defaultText).toContain('^[a-zA-Z]+\\d{3}$');

  // Verify playground matches the testing list
  const matchesBadge = page.locator('div:has-text("correspondance")').last();
  await expect(matchesBadge).toBeVisible();

  // Test playground inputs and counts
  const playgroundTextarea = page.locator('textarea#test-text');
  await expect(playgroundTextarea).toBeVisible();
  await playgroundTextarea.fill('abc123\nhello456\nXYZ789');

  // Add a new rule token (e.g. whitespace)
  const addWhitespaceBtn = page.locator('button:has-text("+ Espace")').first();
  await expect(addWhitespaceBtn).toBeVisible();
  await addWhitespaceBtn.click();

  // Verify a new token row was added
  const rulesRows = page.locator('div:has-text("Espace")');
  await expect(rulesRows.first()).toBeVisible();

  // Test case-insensitive flag toggle
  const caseInsensitiveCheckbox = page.locator('input[type="checkbox"]').nth(1);
  await caseInsensitiveCheckbox.uncheck();

  // Verify compiled pattern has changed (flag i is removed)
  const updatedText = await expressionDisplay.textContent();
  expect(updatedText).not.toContain('/gi');

  // Focus the playground textarea and press Escape to trigger clear
  await playgroundTextarea.focus();
  await page.keyboard.press('Escape');

  // Rules are cleared, expression resets to empty /g
  const clearedText = await expressionDisplay.textContent();
  expect(clearedText).toBe('//g');
});
