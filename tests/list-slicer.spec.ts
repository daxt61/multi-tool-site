import { test, expect } from '@playwright/test';

test.describe('List Slicer Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-slicer');
  });

  test('renders list slicer tool correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('List Slicer & Sub-list Extractor');
    await expect(page.locator('#list-slicer-input')).toBeVisible();
    await expect(page.locator('#list-slicer-output')).toBeVisible();
  });

  test('slices list by index range in range mode', async ({ page }) => {
    const input = page.locator('#list-slicer-input');
    await input.fill('Alpha\nBeta\nGamma\nDelta\nEpsilon');

    const rangeStart = page.locator('#range-start-idx');
    await rangeStart.fill('2');

    const rangeEnd = page.locator('#range-end-idx');
    await rangeEnd.fill('4');

    const output = page.locator('#list-slicer-output');
    // 1-based index 2 to 4 inclusive => Beta, Gamma, Delta
    await expect(output).toHaveValue('Beta\nGamma\nDelta');
  });

  test('slices list by step in step mode', async ({ page }) => {
    const input = page.locator('#list-slicer-input');
    await input.fill('Item 1\nItem 2\nItem 3\nItem 4\nItem 5\nItem 6');

    // Switch to step mode tab
    await page.getByRole('button', { name: 'Step / Interval' }).click();

    const stepSize = page.locator('#step-size');
    await stepSize.fill('2');

    const startOffset = page.locator('#start-offset');
    await startOffset.fill('1');

    const output = page.locator('#list-slicer-output');
    // Every 2nd item starting at item 1 => Item 1, Item 3, Item 5
    await expect(output).toHaveValue('Item 1\nItem 3\nItem 5');
  });

  test('slices list by head/tail in headtail mode', async ({ page }) => {
    const input = page.locator('#list-slicer-input');
    await input.fill('One\nTwo\nThree\nFour\nFive');

    // Switch to headtail mode tab
    await page.getByRole('button', { name: 'Head / Tail' }).click();

    const htPosition = page.locator('#ht-position');
    await htPosition.selectOption('tail');

    const htCount = page.locator('#ht-count');
    await htCount.fill('2');

    const output = page.locator('#list-slicer-output');
    // Last 2 items => Four, Five
    await expect(output).toHaveValue('Four\nFive');
  });

  test('loads quick presets correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Chunks of 3 Items' }).click();

    const output = page.locator('#list-slicer-output');
    await expect(output).toContainText('---');
  });

  test('clears input and restores focus on Escape key', async ({ page }) => {
    const input = page.locator('#list-slicer-input');
    await input.fill('Sample list line 1\nSample list line 2');

    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('copies output when pressing C key when unfocused', async ({ page }) => {
    const output = page.locator('#list-slicer-output');
    await expect(output).not.toHaveValue('');

    // Click outside to unfocus editables
    await page.locator('h1').click();
    await page.keyboard.press('c');

    // Verify copy toast appears
    await expect(page.getByText('Copied sliced list to clipboard')).toBeVisible();
  });
});
