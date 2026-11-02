import { test, expect } from '@playwright/test';

test.describe('NetstringConverter Tool (onlinetools inspired)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/netstring-converter');
    // Ensure the main heading or container is visible
    await expect(page.locator('#netstring-input')).toBeVisible();
  });

  test('encodes words separately by default', async ({ page }) => {
    // Default preset should be 'every moment matters' with encodeWordsSeparately = true
    const output = page.locator('#netstring-output');
    await expect(output).toHaveValue('5:every,6:moment,7:matters,');
  });

  test('encodes entire string as a single netstring when words separate is unchecked', async ({ page }) => {
    // Uncheck "Encode Words Separately"
    const checkbox = page.locator('label', { hasText: 'Encode Words Separately' }).locator('input[type="checkbox"]');
    await checkbox.uncheck();

    const output = page.locator('#netstring-output');
    await expect(output).toHaveValue('20:every moment matters,');
  });

  test('encodes into hex-byte notation <...>', async ({ page }) => {
    // Select Hex-byte format
    const hexRadio = page.locator('label', { hasText: 'Hex-byte' }).locator('input[type="radio"]');
    await hexRadio.check();

    const output = page.locator('#netstring-output');
    // "every moment matters" words encoded as hex:
    // "5:every," in hex starts with 35 3a 65 76 65 72 79 2c
    await expect(output).toHaveValue(/<35 3a 65 76 65 72 79 2c/);
  });

  test('switches to decode mode and decodes netstring to string', async ({ page }) => {
    const decodeModeBtn = page.getByRole('button', { name: 'Netstring to String' });
    await decodeModeBtn.click();

    const input = page.locator('#netstring-input');
    await input.fill('3:All,3:you,4:need,2:is,5:love.,');

    const output = page.locator('#netstring-output');
    await expect(output).toHaveValue('All you need is love.');
  });

  test('handles double protection / recursive netstrings', async ({ page }) => {
    // Click Recursive Netstring preset
    const recursivePresetBtn = page.getByRole('button', { name: 'Recursive Netstring' });
    await recursivePresetBtn.click();

    await expect(recursivePresetBtn).toHaveAttribute('aria-pressed', 'true');
    const output = page.locator('#netstring-output');
    // Output should contain double netstring structure like 66:4:This,...
    await expect(output).toHaveValue(/66:4:This/);

    // Typing in the textarea clears active preset state
    const input = page.locator('#netstring-input');
    await input.type(' more');
    await expect(recursivePresetBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('decodes angle-bracket hex-byte netstring notation', async ({ page }) => {
    const decodeModeBtn = page.getByRole('button', { name: 'Netstring to String' });
    await decodeModeBtn.click();

    const input = page.locator('#netstring-input');
    // <35 3a 68 65 6c 6c 6f 2c> is "5:hello," which decodes to "hello"
    await input.fill('<35 3a 68 65 6c 6c 6f 2c>');

    const output = page.locator('#netstring-output');
    await expect(output).toHaveValue('hello');
  });

  test('keyboard shortcut Esc clears input and C copies output', async ({ page }) => {
    const input = page.locator('#netstring-input');
    await input.fill('hello world');

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');

    // Fill some text and blur input so C key triggers copy
    await input.fill('5:quick,');
    await input.blur();

    await page.keyboard.press('c');
    // Sonner toast notification should appear
    await expect(page.locator('text=Copied output to clipboard!')).toBeVisible();
  });
});
