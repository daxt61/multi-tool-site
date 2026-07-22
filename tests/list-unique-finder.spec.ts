import { test, expect } from '@playwright/test';

test.describe('Find Unique List Items tool', () => {
  test('should load, extract unique/duplicate items, change options, and clear', async ({ page }) => {
    // Navigate to the list unique finder tool page
    await page.goto('http://localhost:5173/en/outil/list-unique-finder');

    // Verify Title
    await expect(page.locator('h1')).toContainText('Find Unique List Items');

    // Locate input textarea
    const inputArea = page.locator('#unique-input');
    await expect(inputArea).toBeVisible();

    // Fill sample list with some duplicate entries
    const sampleList = 'apple\nbanana\napple\norange\nbanana\npear\n';
    await inputArea.fill(sampleList);

    // Locate output textarea
    const outputArea = page.locator('#unique-output');
    await expect(outputArea).toBeVisible();

    // By default, mode is "Strictly Unique" (unique mode)
    // Only 'orange' and 'pear' appear exactly once in the sample list.
    await page.waitForTimeout(300);
    let outputVal = await outputArea.inputValue();
    expect(outputVal.trim()).toBe('orange\npear');

    // Switch to "De-duplicated" mode
    const dedupButton = page.getByRole('button', { name: 'De-duplicated', exact: true });
    await dedupButton.click();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal.trim()).toBe('apple\nbanana\norange\npear');

    // Switch to "Strictly Duplicates" mode
    const dupButton = page.getByRole('button', { name: 'Strictly Duplicates', exact: true });
    await dupButton.click();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal.trim()).toBe('apple\nbanana');

    // Switch to "Frequency Count" mode
    const freqButton = page.getByRole('button', { name: 'Frequency Count', exact: true });
    await freqButton.click();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    // Default format in freq mode is "{item}"
    expect(outputVal.trim()).toBe('apple\nbanana\norange\npear');

    // Change template to "Count formatting: {count}x {item}"
    const templateSelect = page.locator('#template-select');
    await templateSelect.selectOption('count-item');
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal.trim()).toBe('2x apple\n2x banana\n1x orange\n1x pear');

    // Sort alphabetically ascending
    const azButton = page.getByRole('button', { name: 'Alphabetical (A-Z)', exact: true });
    await azButton.click();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal.trim()).toBe('2x apple\n2x banana\n1x orange\n1x pear'); // coincidentally same, let's try sorting descending

    // Sort alphabetically descending
    const zaButton = page.getByRole('button', { name: 'Alphabetical (Z-A)', exact: true });
    await zaButton.click();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal.trim()).toBe('1x pear\n1x orange\n2x banana\n2x apple');

    // Test sorting by Count Descending
    const countDescButton = page.getByRole('button', { name: 'Count Descending', exact: true });
    await countDescButton.click();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal.trim()).toBe('2x apple\n2x banana\n1x orange\n1x pear');

    // Verify copy button works and triggers toast
    const copyButton = page.getByRole('button', { name: 'Copy', exact: true }).first();
    await copyButton.click();

    // Verify toast notification appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();

    // Click "Clear" button
    const clearButton = page.getByRole('button', { name: /Clear/i }).first();
    await clearButton.click();

    // Verify textarea is empty and focused
    await expect(inputArea).toBeEmpty();
    await expect(inputArea).toBeFocused();
  });
});
