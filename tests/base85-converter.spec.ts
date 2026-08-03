import { test, expect } from '@playwright/test';

test.describe('Base85 and Ascii85 Converter Tool', () => {
  test('should perform bidirectional conversion, support multiple variants and options, and handle keyboard shortcuts', async ({ page }) => {
    // Navigate to the tool
    await page.goto('http://localhost:5173/en/outil/base85-converter');

    // 1. Verify title
    await expect(page.locator('h1')).toContainText('Base85 Converter');

    // 2. Default state verification (Ascii85, Encode)
    const inputArea = page.locator('#base85-input');
    const outputArea = page.locator('#base85-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // The default input is "Hello, world!"
    let inputVal = await inputArea.inputValue();
    expect(inputVal).toBe('Hello, world!');

    // Default output should be `<~87cURD_*#TDfTZ)+T~>` in Ascii85 with wrap
    await page.waitForTimeout(300);
    let outputVal = await outputArea.inputValue();
    expect(outputVal).toBe('<~87cURD_*#TDfTZ)+T~>');

    // 3. Switch variant to Z85
    const z85Button = page.getByRole('button', { name: 'Z85 (ZeroMQ)', exact: true });
    await z85Button.click();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    // Default padded output for Z85
    expect(outputVal).toBe('nm=QNz.92Pz/PV8aPIGx');

    // 4. Switch back to Ascii85 and test toggle wrapping option
    const ascii85Button = page.getByRole('button', { name: 'Ascii85 (Adobe)', exact: true });
    await ascii85Button.click();
    await page.waitForTimeout(300);

    // Uncheck "Wrap with <~ and ~> delimiters"
    const wrapCheckbox = page.getByLabel('Wrap with <~ and ~> delimiters');
    await wrapCheckbox.uncheck();
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal).toBe('87cURD_*#TDfTZ)+T');

    // Test space compression ('y' folding)
    const spaceCompCheckbox = page.getByLabel('Enable Space Compression (\'y\' folding for 4 spaces)');
    await spaceCompCheckbox.check();
    await inputArea.fill('    '); // four spaces
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal).toBe('y');

    // 5. Test decoding direction
    const decodeButton = page.getByRole('button', { name: 'Decode', exact: true });
    await decodeButton.click();
    await inputArea.fill('y');
    await page.waitForTimeout(300);

    // Decode 'y' should be '    ' (four spaces)
    outputVal = await outputArea.inputValue();
    expect(outputVal).toBe('    ');

    // Change input back to `<~87cURD_*#TDfTZ)+T~>`
    await inputArea.fill('<~87cURD_*#TDfTZ)+T~>');
    await page.waitForTimeout(300);
    outputVal = await outputArea.inputValue();
    expect(outputVal).toBe('Hello, world!');

    // 6. Test copy action
    const copyButton = page.getByRole('button', { name: /Copy/i }).first();
    await copyButton.click();

    // Verify sonner toast notification
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();

    // 7. Test clearing and Escape key shortcut
    // Clear via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify both are cleared and inputArea is focused
    await expect(inputArea).toBeEmpty();
    await expect(outputArea).toBeEmpty();
    await expect(inputArea).toBeFocused();
  });
});
