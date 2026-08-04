import { test, expect } from '@playwright/test';

test('Cartesian Product Generator functionality and UX', async ({ page, baseURL }) => {
  // Navigate to English version of the tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/cartesian-product`);

  const list1 = page.locator('#cartesian-list-0');
  const list2 = page.locator('#cartesian-list-1');
  const list3 = page.locator('#cartesian-list-2');
  const output = page.locator('#combinations-output');

  // Verify elements exist
  await expect(list1).toBeVisible();
  await expect(list2).toBeVisible();
  await expect(list3).toBeVisible();
  await expect(output).toBeVisible();

  // Test Case 1: Default combinations are generated correctly
  // Default inputs: ["red\ngreen\nblue", "apple\nbanana", "1\n2"]
  // First item should be (red, apple, 1)
  await expect(output).toContainText('(red, apple, 1)');
  await expect(output).toContainText('(blue, banana, 2)');

  // Test Case 2: Edit input lists and see live updates
  await list1.fill('dog\ncat');
  await list2.fill('sleeps\neats');
  await list3.fill('well\nloudly');

  // Combinations should update live
  await expect(output).toContainText('(dog, sleeps, well)');
  await expect(output).toContainText('(cat, eats, loudly)');

  // Test Case 3: Change settings (Prefixes, Suffixes, Separators)
  // Let's change casing to uppercase
  const caseSelect = page.locator('#case-mode-select');
  await caseSelect.selectOption('upper');
  await expect(output).toContainText('(DOG, SLEEPS, WELL)');

  // Change combination prefix/suffix
  const prefixInput = page.locator('#tuple-prefix-input');
  const suffixInput = page.locator('#tuple-suffix-input');
  await prefixInput.fill('[');
  await suffixInput.fill(']');
  await expect(output).toContainText('[DOG, SLEEPS, WELL]');

  // Test Case 4: Add list dynamically
  const addListBtn = page.locator('button:has-text("Add List")');
  await addListBtn.click();

  // New list list-3 should appear
  const list4 = page.locator('#cartesian-list-3');
  await expect(list4).toBeVisible();
  await list4.fill('now\nlater');

  // Verify combination has 4 items
  await expect(output).toContainText('[DOG, SLEEPS, WELL, NOW]');

  // Test Case 5: Limit warn
  // Set combinations limit to 3
  const limitInput = page.locator('#max-combos-input');
  await limitInput.fill('3');

  // Alert box warning should appear
  const alertBox = page.locator('div[role="alert"]');
  await expect(alertBox).toBeVisible();
  await expect(alertBox).toContainText('limit');

  // Restore limit
  await limitInput.fill('500');
  await expect(alertBox).not.toBeVisible();

  // Test Case 6: Keyboard Shortcuts - Escape to clear and restore focus
  await list1.focus();
  await page.keyboard.press('Escape');

  // Verify inputs are cleared
  await expect(list1).toHaveValue('');
  await expect(list2).toHaveValue('');
  await expect(list1).toBeFocused();

  // Test Case 7: Keyboard Shortcut - C to copy
  await list1.fill('alpha');
  await list2.fill('beta');
  await page.keyboard.press('Tab'); // Move focus away
  await page.keyboard.press('c');

  // Verify Sonner toast or output state
  const copyBtn = page.locator('button[title*="Copy"]');
  await expect(copyBtn).toBeVisible();
});
