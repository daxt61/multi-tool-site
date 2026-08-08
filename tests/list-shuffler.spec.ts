import { test, expect } from '@playwright/test';

test.describe('List Shuffler & Randomizer', () => {
  test('should load, handle presets, change settings, shuffle and copy/clear', async ({ page }) => {
    // Navigate to the list shuffler tool page
    await page.goto('http://localhost:5173/en/outil/list-shuffler');

    // Verify Title
    await expect(page.locator('h1')).toContainText('List Shuffler & Randomizer');

    const inputArea = page.locator('#shuffler-input');
    await expect(inputArea).toBeVisible();

    const outputArea = page.locator('#shuffler-output');
    await expect(outputArea).toBeVisible();

    // 1. Load Numbers 1-20 preset
    const numbersPreset = page.getByRole('button', { name: 'Numbers 1-20' });
    await numbersPreset.click();

    // Verify input contains some of the numbers
    const inputVal = await inputArea.inputValue();
    expect(inputVal).toContain('1');
    expect(inputVal).toContain('20');

    // Verify output is filled
    const outputVal = await outputArea.inputValue();
    expect(outputVal).not.toBe('');

    // 2. Change delimiter settings
    const outDelimSelect = page.locator('#shuffler-out-delim');
    await outDelimSelect.selectOption('comma');

    // Verify output now contains commas
    const commaOutput = await outputArea.inputValue();
    expect(commaOutput).toContain(',');

    // 3. Test keyboard shortcuts (Esc to clear)
    await inputArea.focus();
    await page.keyboard.press('Escape');

    // Verify cleared
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
