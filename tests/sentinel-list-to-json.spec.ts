import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('List to JSON Sentinel Security & UX Verification', () => {
  test('converts list to JSON correctly with defaults', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-to-json`);

    const inputField = page.locator('#list-input');
    await expect(inputField).toBeVisible();

    await inputField.fill("Apple\nBanana\nApple\n  Cherry  \n");

    const outputField = page.locator('#json-output');
    await expect(outputField).toBeVisible();

    const outputVal = await outputField.inputValue();
    // Default has trim: true, removeEmpty: true, uniqueOnly: false, sort: false
    expect(JSON.parse(outputVal)).toEqual(["Apple", "Banana", "Apple", "Cherry"]);
  });

  test('toggles options correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-to-json`);

    const inputField = page.locator('#list-input');
    await inputField.fill("Banana\nApple\nApple\n");

    // Enable Unique Only
    await page.click('label:has-text("Unique Only")');
    // Enable Sorting
    await page.click('label:has-text("Sorting")');

    const outputField = page.locator('#json-output');
    const outputVal = await outputField.inputValue();
    expect(JSON.parse(outputVal)).toEqual(["Apple", "Banana"]);
  });

  test('enforces MAX_LENGTH limit and shows localized error', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-to-json`);

    const inputField = page.locator('#list-input');
    const longText = 'a'.repeat(100005); // 100,005 characters (single line)
    await inputField.fill(longText);

    // Expect error alert to be visible
    const errorAlert = page.locator('div[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("The list is too long. Limit of 100,000 characters.");

    // JSON output should be empty array string
    const outputField = page.locator('#json-output');
    await expect(outputField).toHaveValue('[]');
  });

  test('Escape keyboard shortcut clears and resets state', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/list-to-json`);

    const inputField = page.locator('#list-input');
    await inputField.fill("Test list content");

    const outputField = page.locator('#json-output');
    await expect(outputField).not.toHaveValue('[]');

    // Escape shortcut while input is focused
    await inputField.focus();
    await page.keyboard.press('Escape');

    await expect(inputField).toBeEmpty();
    await expect(outputField).toHaveValue('[]');
  });
});
