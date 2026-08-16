import { test, expect } from '@playwright/test';

test.describe('List Minifier Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-minifier');
  });

  test('renders list minifier tool correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/List Minifier/i);
    await expect(page.getByTestId('list-minifier-container')).toBeVisible();
    await expect(page.locator('#list-minifier-input')).toBeVisible();
    await expect(page.locator('#list-minifier-output')).toBeVisible();
  });

  test('minifies raw text list with default options', async ({ page }) => {
    const inputTextArea = page.locator('#list-minifier-input');
    const outputTextArea = page.locator('#list-minifier-output');

    await inputTextArea.fill('  Apple  \n\n  Banana   \n Cherry   ');
    await expect(outputTextArea).toHaveValue('Apple, Banana, Cherry');
  });

  test('handles custom output delimiter and collapse whitespace option', async ({ page }) => {
    const inputTextArea = page.locator('#list-minifier-input');
    const outputTextArea = page.locator('#list-minifier-output');
    const outDelimSelect = page.locator('#list-minifier-out-delim');

    await inputTextArea.fill('  Hello    World \n   Foo   Bar  ');
    await outDelimSelect.selectOption('pipe_space');

    await expect(outputTextArea).toHaveValue('Hello World | Foo Bar');
  });

  test('loads presets correctly', async ({ page }) => {
    const inputTextArea = page.locator('#list-minifier-input');
    const outputTextArea = page.locator('#list-minifier-output');

    // Click CSS Class Names preset
    await page.getByText('CSS Class Names').click();
    await expect(inputTextArea).not.toHaveValue('');
    await expect(outputTextArea).toHaveValue('btn btn-primary px-4 py-2 shadow-md transition-all');
  });

  test('clears inputs and restores focus when Escape is pressed', async ({ page }) => {
    const inputTextArea = page.locator('#list-minifier-input');
    await inputTextArea.fill('  test line 1  \n test line 2  ');

    await page.keyboard.press('Escape');

    await expect(inputTextArea).toHaveValue('');
    await expect(inputTextArea).toBeFocused();
  });

  test('copies minified result when C is pressed', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const inputTextArea = page.locator('#list-minifier-input');
    await inputTextArea.fill('  Item 1  \n  Item 2  ');

    // Unfocus textareas
    await page.locator('body').click();
    await page.keyboard.press('c');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('Item 1, Item 2');
  });
});
