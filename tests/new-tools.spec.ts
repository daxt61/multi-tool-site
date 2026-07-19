import { test, expect } from '@playwright/test';

test.describe('New Tools Tests', () => {
  test('ANSI Escape Stripper - functionality test', async ({ page }) => {
    // Go to the ANSI escape stripper tool
    await page.goto('http://localhost:5173/en/outil/ansi-escape-stripper');

    // Wait for the tool component to load
    await expect(page.locator('h1')).toContainText('ANSI Escape Stripper');

    // Fill in some ANSI sequence text
    const inputTextArea = page.locator('#ansi-input');
    await inputTextArea.fill('\\x1b[31mRedText\\x1b[0m \\x1b[1mBoldText\\x1b[0m');

    // The output should be processed automatically
    const outputTextArea = page.locator('#ansi-output');
    await expect(outputTextArea).toHaveValue('RedText BoldText');

    // Switch stripping mode to Color/Styling only
    const colorModeBtn = page.getByRole('button', { name: 'Colors/Styling Only' });
    await colorModeBtn.click();
    await expect(outputTextArea).toHaveValue('RedText BoldText');

    // Test Esc keyboard shortcut inside input
    await inputTextArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputTextArea).toHaveValue('');
    await expect(outputTextArea).toHaveValue('');
  });

  test('XPath Tester - functionality test', async ({ page }) => {
    // Go to the XPath Tester tool
    await page.goto('http://localhost:5173/en/outil/xpath-tester');

    // Wait for the tool component to load
    await expect(page.locator('h1')).toContainText('XPath Tester');

    // Ensure the default XML document and query are evaluated
    const resultsContainer = page.locator('.break-all');
    await expect(resultsContainer.first()).toContainText('Harry Potter');

    // Try a custom XPath query
    const xpathInput = page.locator('#xpath-query');
    await xpathInput.fill('//book[price > 30]'); // should matches nothing in default book lists
    await expect(page.locator('.italic')).toContainText('No matches found.');

    // Clear everything using clear button
    const clearBtn = page.getByRole('button', { name: 'Clear' });
    await clearBtn.click();
    await expect(xpathInput).toHaveValue('');
    const xmlDocumentArea = page.locator('#xml-document');
    await expect(xmlDocumentArea).toHaveValue('');
  });
});
