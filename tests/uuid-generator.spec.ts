import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('UUID Generator Premium E2E tests', () => {

  test.beforeEach(async ({ context }) => {
    // Grant clipboard permissions for copy actions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('should generate UUIDs with default options', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/uuid-generator`);

    // Default count input should have value 1
    const countInput = page.locator('#uuid-count');
    await expect(countInput).toHaveValue('1');

    // Click on generate button
    await page.click('button:has-text("Générer")');

    // Should have 1 generated UUID code element
    const codes = page.locator('code');
    await expect(codes).toHaveCount(1);

    const text = await codes.first().innerText();
    // Standard UUID v4 format: 8-4-4-4-12 hex characters
    expect(text).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[47][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i);
  });

  test('should support multiple generations and clamping limits', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/uuid-generator`);

    const countInput = page.locator('#uuid-count');
    await countInput.fill('150'); // Exceeds max 100

    // Should clamp to 100 on input blur/change
    await countInput.blur();
    await expect(countInput).toHaveValue('100');

    // Set count to 5
    await countInput.fill('5');
    await page.click('button:has-text("Générer")');

    // Should have 5 generated code elements
    const codes = page.locator('code');
    await expect(codes).toHaveCount(5);
  });

  test('should support advanced formatting: uppercase, braces, hyphens removal, prefix, suffix', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/uuid-generator`);

    // Set count to 3
    const countInput = page.locator('#uuid-count');
    await countInput.fill('3');

    // Enable Uppercase, Braces, and disable Hyphens
    await page.click('button:has-text("Majuscules")');
    await page.click('button:has-text("Accolades")');
    await page.click('button:has-text("Inclure les Tirets")'); // Toggles hyphens off

    // Fill Prefix and Suffix
    await page.fill('#uuid-prefix', 'PFX_');
    await page.fill('#uuid-suffix', '_SFX');

    // Generate
    await page.click('button:has-text("Générer")');

    const codes = page.locator('code');
    await expect(codes).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const text = await codes.nth(i).innerText();
      // Format should be PFX_{HEX32}_SFX in uppercase
      expect(text).toMatch(/^PFX_\{[A-F0-9]{32}\}_SFX$/);
    }
  });

  test('should support copying single item and all items', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/uuid-generator`);

    await page.fill('#uuid-count', '3');
    await page.click('button:has-text("Générer")');

    // Copy single item using locator matching copy button
    const copyButton = page.locator('button[aria-label="Copier"]').first();
    await copyButton.click();

    // Verify clipboard content matches first generated formatted UUID
    const firstCodeText = await page.locator('code').first().innerText();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(firstCodeText);

    // Copy all items
    const copyAllButton = page.locator('button:has-text("Tout copier")');
    await copyAllButton.click();

    // Verify clipboard content has 3 items joined by newlines (default delimiter)
    const allClipboardText = await page.evaluate(() => navigator.clipboard.readText());
    const items = allClipboardText.split('\n');
    expect(items.length).toBe(3);
  });

  test('should support keyboard shortcuts and focus restoration', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/uuid-generator`);

    // Focus count input, enter 4, and press Enter to generate
    const countInput = page.locator('#uuid-count');
    await countInput.focus();
    await countInput.fill('4');
    await page.keyboard.press('Enter');

    // Verify 4 elements are generated
    await expect(page.locator('code')).toHaveCount(4);

    // Unfocus by clicking some text, then press Escape to clear
    await page.click('text=Qu\'est-ce qu\'un UUID ?');
    await page.keyboard.press('Escape');

    // Verify cleared state (empty placeholder visible, code count is 0)
    await expect(page.locator('code')).toHaveCount(0);
    await expect(page.locator('text=Aucun UUID généré')).toBeVisible();

    // Focus should be restored back to countInput
    await expect(countInput).toBeFocused();
  });
});
