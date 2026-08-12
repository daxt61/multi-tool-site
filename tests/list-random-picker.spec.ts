import { test, expect } from '@playwright/test';

test.describe('Random List Item Picker', () => {
  test('should load, handle presets, change settings, pick and copy/clear', async ({ page }) => {
    // Navigate to the list random picker tool page
    await page.goto('http://localhost:5173/en/outil/list-random-picker');

    // Verify Title
    await expect(page.locator('h1')).toContainText('Random List Item Picker');

    const inputArea = page.locator('#picker-input');
    await expect(inputArea).toBeVisible();

    const outputArea = page.locator('#picker-output');
    await expect(outputArea).toBeVisible();

    // 1. Load Raffle Names preset
    const rafflePreset = page.getByRole('button', { name: 'Raffle Names' });
    await rafflePreset.click();

    // Verify input contains some of the raffle names
    const inputVal = await inputArea.inputValue();
    expect(inputVal).toContain('Alice');
    expect(inputVal).toContain('Hannah');

    // Verify output is filled
    const outputVal = await outputArea.inputValue();
    expect(outputVal).not.toBe('');

    // 2. Change delimiter settings
    const outDelimSelect = page.locator('#picker-out-delim');
    await outDelimSelect.selectOption('comma');

    // Verify output now contains commas
    const commaOutput = await outputArea.inputValue();
    expect(commaOutput).toContain(',');

    // 3. Toggle With Replacement checkbox and set quantity
    const replacementCheckbox = page.locator('input[type="checkbox"]').first();
    const isChecked = await replacementCheckbox.isChecked();

    // Toggle replacement (from false to true)
    await replacementCheckbox.click();
    expect(await replacementCheckbox.isChecked()).toBe(!isChecked);

    // 4. Test keyboard shortcuts (Esc to clear)
    await inputArea.focus();
    await page.keyboard.press('Escape');

    // Verify cleared
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
