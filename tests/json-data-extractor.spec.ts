import { test, expect } from '@playwright/test';

test.describe('JSON Data & Key Extractor E2E Tests', () => {
  test('should load correctly, use presets, change modes, filter, and clear', async ({ page }) => {
    // 1. Navigate to the tool view
    await page.goto('http://localhost:5173/en/outil/json-data-extractor');

    // 2. Verify layout tags and headers
    await expect(page.locator('h1')).toContainText('JSON Data & Key Extractor');
    const inputArea = page.locator('#json-input');
    await expect(inputArea).toBeVisible();

    const outputArea = page.locator('#extracted-output');
    await expect(outputArea).toBeVisible();

    // 3. Load Quick Preset (App Configuration)
    const appConfigPreset = page.getByRole('button', { name: 'App Configuration' });
    await appConfigPreset.click();

    // Confirm input contains properties from App Configuration
    const inputVal = await inputArea.inputValue();
    expect(inputVal).toContain('TaskMaster Pro');
    expect(inputVal).toContain('apiCallsPerMinute');

    // Confirm initial output mode (Nested Paths) extracted correctly
    let outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('appName');
    expect(outputVal).toContain('settings.notifications.email');

    // 4. Change Extraction Mode (Flat Keys)
    const keysBtn = page.getByRole('button', { name: 'Flat Keys' });
    await keysBtn.click();

    outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('theme');
    expect(outputVal).toContain('apiCallsPerMinute');
    // It should not contain dotted paths anymore
    expect(outputVal).not.toContain('settings.notifications.email');

    // 5. Filter items with substring matching
    const filterInput = page.locator('#filter-query-input');
    await filterInput.fill('theme');

    outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('theme');
    expect(outputVal).not.toContain('appName');

    // Clear filter
    await filterInput.fill('');

    // 6. Change Sort Order
    const sortSelect = page.locator('#sort-order-select');
    await sortSelect.selectOption('asc');
    const sortedVal = await outputArea.inputValue();
    expect(sortedVal).not.toBe('');

    // 7. Verify Escape key clears both fields and preserves focus
    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
