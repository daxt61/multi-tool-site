import { test, expect } from '@playwright/test';

test.describe('CSV Column Merger Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/csv-column-merger');
    await page.waitForSelector('[data-testid="csv-merger-container"]');
  });

  test('renders correctly with default UI components', async ({ page }) => {
    await expect(page.locator('#csv-merger-input')).toBeVisible();
    await expect(page.locator('#csv-merger-output')).toBeVisible();
    await expect(page.locator('#merged-header')).toBeVisible();
    await expect(page.locator('#glue-string')).toBeVisible();
  });

  test('merges CSV columns correctly with default settings', async ({ page }) => {
    const inputArea = page.locator('#csv-merger-input');
    const outputArea = page.locator('#csv-merger-output');

    await inputArea.fill('FirstName,LastName,City\nAlice,Smith,Paris\nBob,Jones,Lyon');

    // Expected output with default: mergedHeader = "MergedColumn", glue = " ", selectedColumns = [0, 1], keepOriginal = false
    await expect(outputArea).toHaveValue('MergedColumn,City\nAlice Smith,Paris\nBob Jones,Lyon');
  });

  test('updates output when changing glue string and merged header name', async ({ page }) => {
    const inputArea = page.locator('#csv-merger-input');
    const outputArea = page.locator('#csv-merger-output');
    const headerInput = page.locator('#merged-header');
    const glueInput = page.locator('#glue-string');

    await inputArea.fill('FirstName,LastName,City\nAlice,Smith,Paris');
    await headerInput.fill('FullName');
    await glueInput.fill(' - ');

    await expect(outputArea).toHaveValue('FullName,City\nAlice - Smith,Paris');
  });

  test('keeps original columns when keepOriginal is enabled', async ({ page }) => {
    const inputArea = page.locator('#csv-merger-input');
    const outputArea = page.locator('#csv-merger-output');

    await inputArea.fill('FirstName,LastName,City\nAlice,Smith,Paris');

    const keepOrigBtn = page.getByText('Conserver les Colonnes Originales');
    await keepOrigBtn.click();

    await expect(outputArea).toHaveValue('FirstName,LastName,City,MergedColumn\nAlice,Smith,Paris,Alice Smith');
  });

  test('loads quick presets correctly', async ({ page }) => {
    const outputArea = page.locator('#csv-merger-output');

    // Click "Combiner Ville & Code Postal" preset
    const presetBtn = page.getByRole('button', { name: 'Combiner Ville & Code Postal' });
    await presetBtn.click();

    await expect(outputArea).toHaveValue('Name;City;PostalCode;Country;CityZip\nJean Dupont;Paris;75001;France;Paris - 75001\nMarie Curie;Lyon;69002;France;Lyon - 69002\nPierre Martin;Marseille;13001;France;Marseille - 13001');
  });

  test('handles Clear button and Escape key focus restoration', async ({ page }) => {
    const inputArea = page.locator('#csv-merger-input');

    await inputArea.fill('FirstName,LastName\nAlice,Smith');
    await expect(inputArea).toHaveValue('FirstName,LastName\nAlice,Smith');

    // Press Escape key
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('handles Copy shortcut when editable input is unfocused', async ({ page }) => {
    const inputArea = page.locator('#csv-merger-input');
    await inputArea.fill('FirstName,LastName\nAlice,Smith');

    // Blur input area
    await inputArea.blur();

    // Press C key
    await page.keyboard.press('c');

    // Sonner toast should appear
    await expect(page.getByText('CSV fusionné copié dans le presse-papiers !')).toBeVisible();
  });

  test('enforces DoS MAX_LENGTH character ceiling', async ({ page }) => {
    const inputArea = page.locator('#csv-merger-input');
    const hugeText = 'a,b\n'.repeat(30000); // 120,000 characters

    await inputArea.focus();
    await page.evaluate((text) => {
      const textarea = document.querySelector('#csv-merger-input') as HTMLTextAreaElement;
      if (textarea) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, hugeText);

    const value = await inputArea.inputValue();
    expect(value.length).toBeLessThanOrEqual(100000);
  });
});
