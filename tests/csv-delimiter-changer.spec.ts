import { test, expect } from '@playwright/test';

test.describe('CSV Delimiter Changer Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-delimiter-changer');
    await page.waitForSelector('[data-testid="csv-delimiter-changer-container"]');
  });

  test('renders correctly with default UI components', async ({ page }) => {
    await expect(page.locator('[data-testid="csv-delimiter-changer-container"]')).toBeVisible();
    await expect(page.locator('#input-delimiter-mode')).toBeVisible();
    await expect(page.locator('#output-delimiter-mode')).toBeVisible();
    await expect(page.locator('#quote-handling')).toBeVisible();
    await expect(page.locator('#csv-delimiter-input')).toBeVisible();
    await expect(page.locator('#csv-delimiter-output')).toBeVisible();
  });

  test('converts CSV delimiters from comma to semicolon', async ({ page }) => {
    const inputTextArea = page.locator('#csv-delimiter-input');
    const outputTextArea = page.locator('#csv-delimiter-output');

    await inputTextArea.fill('ID,Name,Role\n1,"Doe, John",Admin\n2,Jane,User');
    await page.locator('#input-delimiter-mode').selectOption(',');
    await page.locator('#output-delimiter-mode').selectOption(';');

    const outputText = await outputTextArea.inputValue();
    expect(outputText).toContain('ID;Name;Role');
    expect(outputText).toContain('1;Doe, John;Admin');
    expect(outputText).toContain('2;Jane;User');
  });

  test('converts CSV to TSV (tab delimited)', async ({ page }) => {
    const inputTextArea = page.locator('#csv-delimiter-input');
    const outputTextArea = page.locator('#csv-delimiter-output');

    await inputTextArea.fill('SKU,Product,Price\n101,Widget,10.99\n102,Gadget,25.50');
    await page.locator('#input-delimiter-mode').selectOption(',');
    await page.locator('#output-delimiter-mode').selectOption('\\t');

    const outputText = await outputTextArea.inputValue();
    expect(outputText).toContain('SKU\tProduct\tPrice');
    expect(outputText).toContain('101\tWidget\t10.99');
  });

  test('strips quotes when quote handling is set to strip', async ({ page }) => {
    const inputTextArea = page.locator('#csv-delimiter-input');
    const outputTextArea = page.locator('#csv-delimiter-output');

    await inputTextArea.fill('"Name","Age","City"\n"Alice","30","New York"');
    await page.locator('#quote-handling').selectOption('strip');

    const outputText = await outputTextArea.inputValue();
    expect(outputText).toContain('Name;Age;City');
    expect(outputText).toContain('Alice;30;New York');
  });

  test('loads quick presets correctly', async ({ page }) => {
    const inputTextArea = page.locator('#csv-delimiter-input');
    const outputTextArea = page.locator('#csv-delimiter-output');

    await page.getByRole('button', { name: /Semicolon to Pipe/i }).click();

    expect(await inputTextArea.inputValue()).toContain('SKU;Title;Category;Stock');
    expect(await outputTextArea.inputValue()).toContain('SKU|Title|Category|Stock');
  });

  test('handles Clear button and Escape key focus restoration', async ({ page }) => {
    const inputTextArea = page.locator('#csv-delimiter-input');
    await inputTextArea.fill('ID,Val\n1,A');

    await page.getByRole('button', { name: /Clear/i }).click();
    expect(await inputTextArea.inputValue()).toBe('');
    await expect(inputTextArea).toBeFocused();

    await inputTextArea.fill('Some,Data');
    await page.keyboard.press('Escape');
    expect(await inputTextArea.inputValue()).toBe('');
    await expect(inputTextArea).toBeFocused();
  });

  test('handles Copy shortcut when editable input is unfocused', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const inputTextArea = page.locator('#csv-delimiter-input');
    await inputTextArea.fill('A,B\n1,2');

    // Blur active textarea
    await page.locator('body').click();
    await page.keyboard.press('c');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('A;B');
    expect(clipboardText).toContain('1;2');
  });
});
