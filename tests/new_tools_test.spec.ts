import { test, expect } from '@playwright/test';

test.describe('New Tools Verification', () => {
  test('Text Repeater functionality', async ({ page }) => {
    await page.goto('/en/outil/text-repeater');

    // Check if the page loaded
    await expect(page.locator('h1')).toContainText('Text Repeater');

    // Input text
    const input = page.locator('#text-input');
    await input.fill('Hello');

    // Change count
    const countInput = page.locator('#repeat-count');
    await countInput.fill('5');

    // Check output
    const output = page.locator('#output-text');
    await expect(output).toHaveValue('Hello\nHello\nHello\nHello\nHello');

    // Change separator (using exact text match to avoid ambiguities)
    await page.getByRole('button', { name: 'SPACE' }).click();
    await expect(output).toHaveValue('Hello Hello Hello Hello Hello');

    // Clear
    await page.getByRole('button', { name: 'Clear' }).first().click();
    await expect(input).toHaveValue('');
  });

  test('Pascals Triangle functionality', async ({ page }) => {
    await page.goto('/en/outil/pascals-triangle');

    await expect(page.locator('h1')).toContainText("Pascal's Triangle");

    // Check if triangle is rendered. Target rows specifically.
    const triangleContainer = page.locator('.custom-scrollbar');
    const rows = triangleContainer.locator('> div > div');
    await expect(rows).toHaveCount(10); // default is 10

    // Change rows via slider
    const slider = page.locator('#rows-input');
    await slider.fill('15');
    await expect(rows).toHaveCount(15);
  });
});
