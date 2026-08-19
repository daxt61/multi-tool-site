import { test, expect } from '@playwright/test';

test.describe('List Filter & Line Sorter Tools', () => {
  test('List Filter functionality, presets, and UX', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/list-filter`);

    const inputArea = page.locator('#list-filter-input');
    const outputArea = page.locator('#list-filter-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // 1. Text inclusion filtering (contains)
    await inputArea.fill("apple pie\nbanana smoothie\ncherry tart\napple crumble");
    await page.locator('#filter-pattern-input').fill('apple');
    await expect(outputArea).toHaveValue("apple pie\napple crumble");

    // 2. Filter Action: Remove matching lines (invert match)
    await page.selectOption('#filter-action-select', 'remove');
    await expect(outputArea).toHaveValue("banana smoothie\ncherry tart");

    // 3. Reset Action to keep matching lines and test Regex condition
    await page.selectOption('#filter-action-select', 'keep');
    await page.selectOption('#filter-mode-select', 'regex');
    await page.locator('#filter-pattern-input').fill('^(banana|cherry)');
    await expect(outputArea).toHaveValue("banana smoothie\ncherry tart");

    // 4. Quick Preset loading
    const errorPresetBtn = page.getByRole('button', { name: 'Filter Error Logs' });
    await expect(errorPresetBtn).toBeVisible();
    await errorPresetBtn.click();

    await expect(inputArea).not.toHaveValue('');
    await expect(outputArea).not.toHaveValue('');

    // 5. Escape key clears input and restores focus
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('Upgraded Line Sorter functionality and presets', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/line-sorter`);

    const inputArea = page.locator('#lines-input');
    const outputArea = page.locator('#lines-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // 1. Load Quick Preset
    const fruitPresetBtn = page.getByRole('button', { name: 'Unsorted Fruit Names' });
    await expect(fruitPresetBtn).toBeVisible();
    await fruitPresetBtn.click();

    await expect(inputArea).not.toHaveValue('');
    // Alphabetical Ascending by default for fruits preset
    const outputValue = await outputArea.inputValue();
    expect(outputValue.startsWith('Apple')).toBe(true);

    // 2. Numeric sorting
    const numbersPresetBtn = page.getByRole('button', { name: 'Messy Numbers List' });
    await numbersPresetBtn.click();
    await expect(outputArea).toHaveValue("-99\n-15\n0\n3.14159\n7.89\n42.5\n100\n1000");

    // 3. Escape key clears input
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
