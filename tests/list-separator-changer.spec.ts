import { test, expect } from '@playwright/test';

test.describe('List Separator Changer Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-separator-changer');
  });

  test('should render properly with default inputs and convert comma to newline', async ({ page }) => {
    const input = page.locator('#list-separator-input');
    const output = page.locator('#list-separator-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    const outputVal = await output.inputValue();
    expect(outputVal).toContain('apple\nbanana\ncherry');
  });

  test('should apply quick presets correctly', async ({ page }) => {
    const input = page.locator('#list-separator-input');
    const output = page.locator('#list-separator-output');

    // Click "CSV to Pipe" preset
    const presetBtn = page.getByRole('button', { name: 'CSV to Pipe' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    expect(await input.inputValue()).toBe('john@example.com, admin, active, US');
    const outputVal = await output.inputValue();
    expect(outputVal).toContain('john@example.com | admin | active | US');
  });

  test('should clear inputs using the Clear button and focus the input', async ({ page }) => {
    const input = page.locator('#list-separator-input');
    const clearBtn = page.getByRole('button', { name: 'Clear' });

    await clearBtn.click();
    expect(await input.inputValue()).toBe('');
    await expect(input).toBeFocused();
  });

  test('should support keyboard shortcut Esc to clear input and C to copy output', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const input = page.locator('#list-separator-input');
    await input.focus();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    expect(await input.inputValue()).toBe('');

    // Type new list
    await input.fill('red, green, blue');
    await page.keyboard.press('Tab'); // Blur input

    // Press C to copy
    await page.keyboard.press('c');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('red\ngreen\nblue');
  });
});
