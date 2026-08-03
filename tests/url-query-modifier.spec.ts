import { test, expect } from '@playwright/test';

test.describe('URL Query Parameter Builder E2E Tests', () => {
  test('Correctly parses, modifies, and regenerates URL query parameters', async ({ page }) => {
    // Navigate to the tool view
    await page.goto('http://localhost:5173/en/outil/url-query-modifier');

    // Verify initial layout elements are visible
    const inputField = page.locator('#url-input');
    await expect(inputField).toBeVisible();

    // The default URL should be loaded and parsed
    const fullUrlOutput = page.locator('.break-all.select-all').first();
    await expect(fullUrlOutput).toContainText('https://api.example.com/v1/search?');

    // Verify first parameter inputs are loaded
    const firstParamKey = page.locator('[aria-label="Param key 1"]');
    await expect(firstParamKey).toHaveValue('q');
    const firstParamVal = page.locator('[aria-label="Param value 1"]');
    await expect(firstParamVal).toHaveValue('developer tools');

    // Modify a parameter value
    await firstParamVal.fill('playwright master');
    await expect(fullUrlOutput).toContainText('q=playwright+master');

    // Add a new parameter
    const addBtn = page.getByRole('button', { name: 'Add', exact: true });
    await addBtn.click();

    const lastParamKey = page.locator('[aria-label^="Param key"]').last();
    await lastParamKey.fill('new_param');
    const lastParamVal = page.locator('[aria-label^="Param value"]').last();
    await lastParamVal.fill('awesome_value');

    // Verify parameter inclusion in output URL
    await expect(fullUrlOutput).toContainText('new_param=awesome_value');
  });

  test('Bulk Edit applies query changes correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/url-query-modifier');

    // Open Bulk Edit Mode
    const bulkBtn = page.locator('button:has-text("Bulk Edit")');
    await bulkBtn.click();

    const bulkTextarea = page.locator('#bulk-textarea');
    await expect(bulkTextarea).toBeVisible();

    // Settle a fresh batch of variables
    await bulkTextarea.fill('user=jules\nrole=admin\nactive=true');

    // Apply bulk changes
    const applyBtn = page.locator('button:has-text("Apply Changes")');
    await applyBtn.click();

    // Verify visual list reflects updated parameter keys
    const firstKeyInput = page.locator('[aria-label="Param key 1"]');
    await expect(firstKeyInput).toHaveValue('user');
    const firstValInput = page.locator('[aria-label="Param value 1"]');
    await expect(firstValInput).toHaveValue('jules');

    const secondKeyInput = page.locator('[aria-label="Param key 2"]');
    await expect(secondKeyInput).toHaveValue('role');
  });

  test('Keyboard shortcuts: C to copy, Esc to clear with programmatic focus restoration', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/url-query-modifier');

    const inputField = page.locator('#url-input');

    // Click outside to defocus
    await page.click('h1');

    // Focus on body and hit Escape to clear inputs
    await page.keyboard.press('Escape');

    // Expect inputField to be cleared and programmatically focused
    await expect(inputField).toHaveValue('');
    await expect(inputField).toBeFocused();

    // Fill some value
    await inputField.fill('test-domain.com?param=1');
    await page.click('button:has-text("Parse")');

    // Press C to copy full updated URL
    await page.click('h1'); // Defocus first
    await page.keyboard.press('c');

    // Verify a sonner toast is triggered confirming copying
    const toast = page.locator('.sonner-toast, [data-sonner-toast]');
    await expect(toast.last()).toBeVisible();
  });
});
