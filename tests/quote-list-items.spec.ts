import { test, expect } from '@playwright/test';

test.describe('QuoteListItems Premium E2E Verification', () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    // Grant clipboard permissions to avoid headless browser permission blocks
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to the tool's page under French locale using base URL
    await page.goto(`${baseURL || 'http://localhost:5173'}/fr/outil/quote-list-items`);
    await page.waitForLoadState('networkidle');
  });

  test('correctly quotes list items with standard double quote style', async ({ page }) => {
    const inputArea = page.locator('textarea#quote-input');
    await expect(inputArea).toBeVisible();

    // Type input elements on newlines
    await inputArea.fill('apple\nbanana\norange');

    // Output area should reflect the double-quoted elements
    const outputArea = page.locator('textarea#quote-output');
    await expect(outputArea).toHaveValue('"apple"\n"banana"\n"orange"');
  });

  test('supports single quote style and different delimiters', async ({ page }) => {
    // Select Single Quote
    await page.selectOption('select#quote-style', 'single');

    // Fill input
    await page.locator('textarea#quote-input').fill('apple\nbanana\norange');

    // Change output delimiter to Comma + Space
    await page.selectOption('select#out-delimiter', 'comma_space');

    const outputArea = page.locator('textarea#quote-output');
    await expect(outputArea).toHaveValue("'apple', 'banana', 'orange'");
  });

  test('supports custom quote wrapping', async ({ page }) => {
    // Select Custom Wrapper
    await page.selectOption('select#quote-style', 'custom');

    // Custom left/right fields should become visible
    const customLeft = page.locator('input#custom-left');
    const customRight = page.locator('input#custom-right');
    await expect(customLeft).toBeVisible();
    await expect(customRight).toBeVisible();

    await customLeft.fill('<<');
    await customRight.fill('>>');

    // Fill input
    await page.locator('textarea#quote-input').fill('apple\nbanana');

    const outputArea = page.locator('textarea#quote-output');
    await expect(outputArea).toHaveValue('<<apple>>\n<<banana>>');
  });

  test('respects quote non-numeric items only option', async ({ page }) => {
    // Type a list of values including a number
    await page.locator('textarea#quote-input').fill('apple\n42\nbanana');

    // Enable "Quote non-numeric items only"
    await page.locator('input[type="checkbox"]').nth(2).check(); // third checkbox is non-numeric

    const outputArea = page.locator('textarea#quote-output');
    await expect(outputArea).toHaveValue('"apple"\n42\n"banana"');
  });

  test('successfully unquotes list items', async ({ page }) => {
    // Switch operation mode to Unquote
    await page.getByRole('button', { name: 'Supprimer les Guillemets' }).click();

    // Input quoted items
    await page.locator('textarea#quote-input').fill('"apple"\n"banana"');

    const outputArea = page.locator('textarea#quote-output');
    await expect(outputArea).toHaveValue('apple\nbanana');
  });

  test('clears input with Escape key and preserves focus', async ({ page }) => {
    const inputArea = page.locator('textarea#quote-input');
    await inputArea.fill('hello world');

    // Ensure it is focused, then press Escape
    await inputArea.focus();
    await page.keyboard.press('Escape');

    // Text area should be empty and still focused
    await expect(inputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('copies output with shortcut C when input is not focused', async ({ page }) => {
    const inputArea = page.locator('textarea#quote-input');
    await inputArea.fill('hello');

    // Focus the header or non-input area to ensure focus is on the document
    await page.locator('h1').first().click();

    // Trigger the copy keybind 'C'
    await page.keyboard.press('c');

    // Copy event should trigger sonner toast
    const toastMessage = page.locator('[data-sonner-toast]');
    await expect(toastMessage).toBeVisible();
  });

  test('enforces strict 100,000 character limit', async ({ page }) => {
    const largeInput = 'a'.repeat(100001); // 100,001 chars
    await page.locator('textarea#quote-input').fill(largeInput);

    // Expect alert/error message for limit
    const errorAlert = page.locator('div[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('100');
    await expect(errorAlert).toContainText('caractères');
  });
});
