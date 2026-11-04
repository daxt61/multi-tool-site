import { test, expect } from '@playwright/test';

test.describe('OnlineTools List Utilities Suite: Top List Item Finder & List Length Finder', () => {
  test('Top List Item Finder: Loads preset, calculates item counts and percentages, and changes formatting', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/top-list-items');
    await expect(page.locator('h1')).toContainText('Find Most Popular List Items');

    // Test quick preset: Produce & Groceries
    const groceriesPresetBtn = page.getByRole('button', { name: 'Produce & Groceries' });
    await expect(groceriesPresetBtn).toBeVisible();
    await groceriesPresetBtn.click();
    await expect(groceriesPresetBtn).toHaveAttribute('aria-pressed', 'true');

    // Input should contain corn, squash, carrot...
    const input = page.locator('#popular-items-input');
    await expect(input).toHaveValue(/Corn.*Squash.*carrot/);

    // Verify output shows Corn with 5 hits (case-insensitive grouping retains first encountered display case)
    const output = page.locator('#popular-items-output');
    await expect(output).toHaveValue(/Corn: 5/i);
    await expect(output).toHaveValue(/Tomato: 3/i);
    await expect(output).toHaveValue(/Peas: 3/i);

    // Change format to percentage
    const formatSelect = page.locator('#output-format-select');
    await formatSelect.selectOption('percentage');
    await expect(output).toHaveValue(/Corn: 5 \(\d+(\.\d+)?%\)/i);

    // Change format to fraction
    await formatSelect.selectOption('fraction');
    await expect(output).toHaveValue(/Corn: 5 \(5\/\d+\)/i);

    // Test custom template
    await formatSelect.selectOption('template');
    const templateInput = page.locator('#custom-template-input');
    await templateInput.fill('#{rank} -> {item} = {count}');
    await expect(output).toHaveValue(/#1 -> Corn = 5/i);

    // Test copy button
    const copyBtn = page.getByTitle(/Copy/i);
    await copyBtn.click();
    await expect(page.locator('text=Top items copied to clipboard!')).toBeVisible();

    // Test clear button
    const clearBtn = page.getByTitle(/Clear/i);
    await clearBtn.click();
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('List Length Finder: Calculates total, unique, and duplicate counts across delimiter types', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-length-finder');
    await expect(page.locator('h1')).toContainText('Find List Length');

    // Test quick preset: Hex Memory Addresses
    const hexPresetBtn = page.getByRole('button', { name: 'Hex Memory Addresses' });
    await expect(hexPresetBtn).toBeVisible();
    await hexPresetBtn.click();
    await expect(hexPresetBtn).toHaveAttribute('aria-pressed', 'true');

    // Computed output length in hex preset: 105 tokens
    const lengthOutput = page.locator('#list-length-output');
    await expect(lengthOutput).toHaveValue('105');

    // Test quick preset: Duplicate Character Copies ('a; b; c; a; a; b; b; c; c')
    const letterTokensBtn = page.getByRole('button', { name: 'Duplicate Character Copies' });
    await letterTokensBtn.click();
    await expect(letterTokensBtn).toHaveAttribute('aria-pressed', 'true');

    // In duplicate mode for 'a; b; c; a; a; b; b; c; c': total 9, unique 3 => duplicate copies = 6
    await expect(lengthOutput).toHaveValue('6');

    // Switch to Count All mode
    const countAllBtn = page.getByRole('button', { name: 'Count All' });
    await countAllBtn.click();
    await expect(lengthOutput).toHaveValue('9');

    // Switch to Count Unique mode
    const countUniqueBtn = page.getByRole('button', { name: 'Count Unique' });
    await countUniqueBtn.click();
    await expect(lengthOutput).toHaveValue('3');

    // Test calendar months preset with regex delimiter
    const monthsBtn = page.getByRole('button', { name: 'Calendar Months in Columns' });
    await monthsBtn.click();
    // 12 distinct unique calendar months in preset
    await expect(lengthOutput).toHaveValue('12');

    // Test copy button
    const copyBtn = page.getByTitle(/Copy/i);
    await copyBtn.click();
    await expect(page.locator('text=List length copied:')).toBeVisible();

    // Test clear button
    const clearBtn = page.getByTitle(/Clear/i);
    await clearBtn.click();
    await expect(page.locator('#list-length-input')).toHaveValue('');
    await expect(lengthOutput).toHaveValue('0');
  });

  test('Navigation & Search finds both tools', async ({ page }) => {
    await page.goto('http://localhost:5173/en');

    // Search for "popular"
    const searchInput = page.locator('#tool-search');
    await searchInput.fill('popular');
    await expect(page.locator('#tool-title-top-list-items')).toBeVisible();

    // Search for "length"
    await searchInput.fill('length');
    await expect(page.locator('#tool-title-list-length-finder')).toBeVisible();
  });
});
