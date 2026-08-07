import { test, expect } from '@playwright/test';

test.describe('JSONPath Tester Premium UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the English route of the JSONPath Tester tool
    await page.goto('http://localhost:5173/en/outil/json-path');
    await page.waitForLoadState('networkidle');
  });

  test('should load default/preset values and correctly evaluate JSONPath query', async ({ page }) => {
    // Verify standard page headers & text areas are present
    const header = page.getByRole('heading', { name: 'JSONPath Tester' });
    await expect(header).toBeVisible();

    const jsonInput = page.locator('#json-input');
    const pathInput = page.locator('#path-input');
    const resultOutput = page.locator('#result-output');

    // Input some mock JSON and query
    await jsonInput.fill(JSON.stringify({ company: { employees: [{ name: "John Doe" }, { name: "Jane Smith" }] } }));
    await pathInput.fill('$.company.employees[*].name');

    // Verify output with retry-safe expect assertion
    await expect(resultOutput).toHaveValue(/John Doe/);
    await expect(resultOutput).toHaveValue(/Jane Smith/);
  });

  test('should support presets loading and trigger successful toast', async ({ page }) => {
    // Click on User Directory preset. Use a flexible matcher for preset buttons
    const userPresetButton = page.locator('button').filter({ hasText: /User Directory/ }).first();
    await expect(userPresetButton).toBeVisible();
    await userPresetButton.click();

    // Verify toast is visible
    const toast = page.locator('li[data-sonner-toast]').filter({ hasText: 'Preset loaded successfully!' }).first();
    await expect(toast).toBeVisible();

    // Verify inputs have been populated
    const pathInput = page.locator('#path-input');
    await expect(pathInput).toHaveValue('$[*].contact.email');

    const resultOutput = page.locator('#result-output');

    // Playwright automatically retries toHaveValue, handling any React state lag
    await expect(resultOutput).toHaveValue(/alice@example.com/);
    await expect(resultOutput).toHaveValue(/charlie@example.com/);
    await expect(resultOutput).toHaveValue(/bob@example.com/);
  });

  test('should clear inputs, show success toast, and programmatically restore focus on Escape or Clear button click', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    await jsonInput.fill('{"a": 1}');

    const clearButton = page.getByRole('button', { name: 'Clear', exact: true });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify toast notification
    const toast = page.locator('li[data-sonner-toast]').filter({ hasText: 'Inputs cleared!' }).first();
    await expect(toast).toBeVisible();

    // Verify inputs have been cleared/reset
    await expect(jsonInput).toHaveValue('');
    const pathInput = page.locator('#path-input');
    await expect(pathInput).toHaveValue('$');

    // Verify focus is restored to the primary textarea
    await expect(jsonInput).toBeFocused();
  });

  test('should copy output and show toast on Copy button click or pressing C key', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    await jsonInput.fill('{"test": "ok"}');
    await page.waitForTimeout(500);

    const copyButton = page.getByRole('button', { name: 'Copy', exact: true });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify toast notification
    const copyToast = page.locator('li[data-sonner-toast]').filter({ hasText: 'Result copied to clipboard!' }).first();
    await expect(copyToast).toBeVisible();

    // Test Escape keyboard shortcut globally (focus is not on an editable element)
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
    });

    await page.keyboard.press('Escape');
    const clearToast = page.locator('li[data-sonner-toast]').filter({ hasText: 'Inputs cleared!' }).first();
    await expect(clearToast).toBeVisible();
    await expect(jsonInput).toHaveValue('');
  });
});
