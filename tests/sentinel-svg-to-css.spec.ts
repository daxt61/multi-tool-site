import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('SVG to CSS Sentinel Security & UX Verification', () => {
  test('converts SVG to CSS background-image correctly (URI and Base64 modes)', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/svg-to-css`);

    // Verify proper label-to-textarea association
    const inputLabel = page.locator('label[for="svg-input"]');
    await expect(inputLabel).toBeVisible();
    await expect(inputLabel).toContainText('SVG Source');

    const inputField = page.locator('#svg-input');
    await expect(inputField).toBeVisible();

    // Input some SVG
    const sampleSvg = '<svg width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';
    await inputField.fill(sampleSvg);

    // Default mode is URI Encoded
    const cssOutput = page.locator('.p-6.bg-slate-900');
    await expect(cssOutput).toBeVisible();
    let textContent = await cssOutput.innerText();
    expect(textContent).toContain('background-image: url("data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22red%22%2F%3E%3C%2Fsvg%3E");');

    // Switch to Base64 mode
    const base64Button = page.locator('button:has-text("Base64")');
    await base64Button.click();

    textContent = await cssOutput.innerText();
    expect(textContent).toContain('background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InJlZCIvPjwvc3ZnPg==");');
  });

  test('enforces MAX_LENGTH limit and shows localized error', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/svg-to-css`);

    const inputField = page.locator('#svg-input');
    const longText = '<svg>' + 'a'.repeat(100005) + '</svg>'; // 100,011 characters
    await inputField.fill(longText);

    // Expect error alert to be visible
    const errorAlert = page.locator('div.bg-rose-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Input is too long. Limit of 100,000 characters.");

    // CSS output should be placeholder code
    const cssOutput = page.locator('.p-6.bg-slate-900');
    await expect(cssOutput).toHaveText("Generated code will appear here...");
  });

  test('Escape keyboard shortcut clears and resets state, restoring focus', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/svg-to-css`);

    const inputField = page.locator('#svg-input');
    await inputField.fill('<svg></svg>');

    // Focus input field and press Escape
    await inputField.focus();
    await page.keyboard.press('Escape');

    await expect(inputField).toBeEmpty();
    await expect(inputField).toBeFocused();
  });

  test('C key keyboard shortcut copies the CSS property when input is not focused', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/svg-to-css`);

    // Override clipboard API
    await page.addInitScript(() => {
      let clipboardText = '';
      (navigator as any).clipboard = {
        writeText: async (text: string) => {
          clipboardText = text;
        },
        readText: async () => clipboardText,
      };
    });

    const inputField = page.locator('#svg-input');
    await inputField.fill('<svg width="10" height="10"></svg>');

    // Click outside of input on the heading to lose focus
    await page.click('h1');

    // Press 'c'
    await page.keyboard.press('c');

    // Toast from sonner should be visible
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Copied');
  });
});
