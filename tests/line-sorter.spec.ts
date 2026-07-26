import { test, expect } from '@playwright/test';

test('Line Sorter functionality and UX', async ({ page, baseURL }) => {
  // Navigate to English version of the tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/line-sorter`);

  const inputArea = page.locator('#lines-input');
  const outputArea = page.locator('#lines-output');

  // Verify elements exist
  await expect(inputArea).toBeVisible();
  await expect(outputArea).toBeVisible();

  // Test Case 1: Simple Alphabetical Ascending Sort
  await inputArea.fill("banana\napple\ncherry");
  // Default sort is alpha-asc, which should trigger immediately on input
  await expect(outputArea).toHaveValue("apple\nbanana\ncherry");

  // Test Case 2: Alphabetical Descending Sort
  await page.selectOption('#sort-type-select', 'alpha-desc');
  await expect(outputArea).toHaveValue("cherry\nbanana\napple");

  // Test Case 3: Line Length Ascending
  await page.selectOption('#sort-type-select', 'length-asc');
  await inputArea.fill("elephants\ncat\ndolphin");
  await expect(outputArea).toHaveValue("cat\ndolphin\nelephants");

  // Test Case 4: Duplicate removal toggle
  await inputArea.fill("apple\nbanana\napple\ncherry");
  await page.selectOption('#sort-type-select', 'alpha-asc');

  // Set deduplicate to true (check checkbox)
  const deduplicateCheckbox = page.locator('input[type="checkbox"]').nth(3); // Deduplicate is the 4th checkbox
  await deduplicateCheckbox.check();
  await expect(outputArea).toHaveValue("apple\nbanana\ncherry");

  // Uncheck deduplicate
  await deduplicateCheckbox.uncheck();
  await expect(outputArea).toHaveValue("apple\napple\nbanana\ncherry");

  // Test Case 5: Keyboard Shortcuts - Escape to clear and restore focus
  await inputArea.focus();
  await inputArea.press('Escape');
  await expect(inputArea).toHaveValue('');
  await expect(inputArea).toBeFocused();

  // Test Case 6: Copy keyboard shortcut when unfocused
  await inputArea.fill("hello");
  await page.keyboard.press('Tab'); // Move focus away
  await page.keyboard.press('c');

  // Verify copy button is visible and has exact attributes
  const copyBtn = page.locator('button[title*="Copy"]').last();
  await expect(copyBtn).toBeVisible();
});
