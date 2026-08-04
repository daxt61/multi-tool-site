import { test, expect } from '@playwright/test';

test.describe('Universal Text Encoder & Decoder Premium E2E tests', () => {

  test('should render properly and handle bidirectional conversions with configuration options', async ({ page }) => {
    // Go to the universal-encoder-decoder page in French locale
    await page.goto('http://localhost:5173/fr/outil/universal-encoder-decoder');

    // Confirm heading is rendered
    await expect(page.locator('h1')).toContainText('Encodeur & Décodeur Universel');

    // Default value check ("Hello World!") and its propagations
    const textTextarea = page.locator('textarea#text-textarea');
    await expect(textTextarea).toHaveValue('Hello World!');

    // Base64 textarea should contain base64 encoding of Hello World!
    const b64Textarea = page.locator('textarea#b64-textarea');
    await expect(b64Textarea).toHaveValue('SGVsbG8gV29ybGQh');

    // URL encoded textarea should be Hello%20World!
    const urlTextarea = page.locator('textarea#url-textarea');
    await expect(urlTextarea).toHaveValue('Hello%20World!');

    // Test Bidirectional Conversion: Type into Hex box and verify Plain Text updates
    const hexTextarea = page.locator('textarea#hex-textarea');
    // Clear and type "41 42 43" (ABC in Hex)
    await hexTextarea.fill('');
    await hexTextarea.type('41 42 43');

    // Plain text should now be "ABC"
    await expect(textTextarea).toHaveValue('ABC');

    // Base64 should be "QUJD"
    await expect(b64Textarea).toHaveValue('QUJD');

    // Test Configuration Parameter change: Caesar Shift change
    const caesarTextarea = page.locator('textarea#caesar-textarea');
    // Default shift of 3 for ABC should be DEF
    await expect(caesarTextarea).toHaveValue('DEF');

    // Change slider value
    const slider = page.locator('input[type="range"]');
    await slider.fill('1'); // shift by 1 should be BCD

    await expect(caesarTextarea).toHaveValue('BCD');

    // Test copy shortcut indicator and copy action
    const copyButton = page.locator('button[title="Copy format"]').first();
    await copyButton.click();

    // Verify copy success toast is displayed
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();

    // Test Clear / Reset button
    const resetButton = page.locator('button:has-text("Réinitialiser")');
    await resetButton.click();

    // All values should be empty
    await expect(textTextarea).toHaveValue('');
    await expect(b64Textarea).toHaveValue('');
    await expect(hexTextarea).toHaveValue('');
  });

  test('should trigger keyboard shortcuts for clearing and copying successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/universal-encoder-decoder');

    const textTextarea = page.locator('textarea#text-textarea');
    await expect(textTextarea).toHaveValue('Hello World!');

    // Focus away from textareas to let global key listener capture shortcuts
    await page.locator('h1').click();

    // Trigger clear/reset shortcut: Escape
    await page.keyboard.press('Escape');

    // Check values are now cleared
    await expect(textTextarea).toHaveValue('');
  });

});
