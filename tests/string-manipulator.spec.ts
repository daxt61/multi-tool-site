import { test, expect } from '@playwright/test';

test.describe('String Manipulator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/string-manipulator');
  });

  test('renders string manipulator tool correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/String Manipulator/i);
    await expect(page.getByTestId('string-manipulator-container')).toBeVisible();
    await expect(page.locator('#manip-input')).toBeVisible();
    await expect(page.locator('#manip-output')).toBeVisible();
  });

  test('loads quick preset and performs padding and truncation', async ({ page }) => {
    const inputTextArea = page.locator('#manip-input');
    const outputTextArea = page.locator('#manip-output');

    await page.getByText('Fixed-Width Columns').click();

    await expect(inputTextArea).toContainText('Customer 101');
    await expect(outputTextArea).toContainText('Customer 101         ');
    await expect(outputTextArea).toContainText('Very long account ho...');
  });

  test('clears input and restores focus on Escape press', async ({ page }) => {
    const inputTextArea = page.locator('#manip-input');
    await inputTextArea.fill('Sample text line');

    await page.keyboard.press('Escape');

    await expect(inputTextArea).toHaveValue('');
    await expect(inputTextArea).toBeFocused();
  });

  test('copies processed output when C is pressed outside editable fields', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const inputTextArea = page.locator('#manip-input');
    await inputTextArea.fill('Hello World');

    // Unfocus textareas
    await page.locator('body').click();
    await page.keyboard.press('c');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('Hello World');
  });
});
