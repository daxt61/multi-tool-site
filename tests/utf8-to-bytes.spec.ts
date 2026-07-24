import { test, expect } from '@playwright/test';

test.describe('UTF-8 to Bytes Converter Tool', () => {
  test('should load, perform text-to-bytes conversion, customize format options, swap directions, and use shortcuts', async ({ page }) => {
    // 1. Navigate directly to the tool page
    await page.goto('http://localhost:5173/en/outil/utf8-to-bytes');

    // 2. Verify Title (check both English and French titles due to auto-redirection / language detection)
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText === 'UTF-8 to Bytes Converter' || titleText === 'Convertisseur UTF-8 en Octets').toBe(true);

    // Locate input and output elements
    const inputArea = page.locator('#utf8-input');
    const outputArea = page.locator('#utf8-output');
    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // 3. Test Default: Text to Bytes (Hex format, space delimiter)
    await inputArea.fill('Hello');
    await page.waitForTimeout(300);
    // H=48, e=65, l=6c, l=6c, o=6f
    await expect(outputArea).toHaveValue(/48 65 6[cC] 6[cC] 6[fF]/);

    // 4. Test format change to Decimal
    await page.locator('#format-select').selectOption('decimal');
    await page.waitForTimeout(300);
    // H=72, e=101, l=108, l=108, o=111
    await expect(outputArea).toHaveValue('72 101 108 108 111');

    // 5. Test format change to Binary
    await page.locator('#format-select').selectOption('binary');
    await page.waitForTimeout(300);
    await expect(outputArea).toHaveValue('01001000 01100101 01101100 01101100 01101111');

    // 6. Test format change to Octal
    await page.locator('#format-select').selectOption('octal');
    await page.waitForTimeout(300);
    await expect(outputArea).toHaveValue('110 145 154 154 157');

    // 7. Test prefix options for Octal
    await page.locator('#prefix-select').selectOption('\\');
    await page.waitForTimeout(300);
    await expect(outputArea).toHaveValue('\\110 \\145 \\154 \\154 \\157');

    // 8. Test delimiter customization (Comma)
    await page.locator('#delimiter-select').selectOption('comma');
    await page.waitForTimeout(300);
    await expect(outputArea).toHaveValue('\\110,\\145,\\154,\\154,\\157');

    // Reset delimiter & prefix & format to test Hex options
    await page.locator('#delimiter-select').selectOption('space');
    await page.locator('#prefix-select').selectOption('none');
    await page.locator('#format-select').selectOption('hex');
    await page.waitForTimeout(300);

    // 9. Test Hex casing (uppercase)
    const uppercaseCheckbox = page.locator('#uppercase-checkbox');
    await expect(uppercaseCheckbox).toBeVisible();
    await uppercaseCheckbox.check();
    await page.waitForTimeout(300);
    await expect(outputArea).toHaveValue('48 65 6C 6C 6F');

    // 10. Test copying via button
    const copyButton = page.locator('button:has(svg.lucide-copy)').first();
    await copyButton.click();
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();

    // 11. Test bidirectional swap (Bytes to Text)
    const swapButton = page.locator('button:has(svg.lucide-arrow-right-left)').first();
    await swapButton.click();
    await page.waitForTimeout(300);

    // Now input should be bytes, output should be decoded text
    await inputArea.fill('c3 a9'); // "é" in UTF-8 hex
    await page.locator('#format-select').selectOption('hex');
    await page.locator('#delimiter-select').selectOption('space');
    await page.waitForTimeout(300);
    await expect(outputArea).toHaveValue('é');

    // 12. Test clear button and input refocusing
    const clearButton = page.locator('button:has(svg.lucide-trash-2)').first();
    await clearButton.click();
    await expect(inputArea).toBeEmpty();
    await expect(inputArea).toBeFocused();

    // 13. Test keyboard shortcuts (Escape to clear, C to copy)
    await inputArea.fill('Testing shortcuts');
    // Ensure we are focused out of the textbox before using global triggers, or use focus trigger
    await page.locator('h1').click(); // Unfocus textarea
    await page.keyboard.press('c'); // Trigger copy
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();

    await page.keyboard.press('Escape'); // Trigger clear
    await expect(inputArea).toBeEmpty();
  });
});
