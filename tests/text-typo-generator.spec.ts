import { test, expect } from '@playwright/test';

test.describe('Text Typo Generator tool', () => {
  test('should load, generate typos, copy, clear, and download', async ({ page }) => {
    // Navigate directly to the tool page
    await page.goto('http://localhost:5173/en/outil/text-typo-generator');

    // Verify Title
    await expect(page.locator('h1')).toContainText('Text Typo Generator');

    // Locate input textarea
    const inputArea = page.locator('#typo-input');
    await expect(inputArea).toBeVisible();

    // Type text into the textarea
    const sampleText = 'The quick brown fox jumps over the lazy dog. Programming is highly logical and incredibly beautiful.';
    await inputArea.fill(sampleText);

    // Get the generated output
    const outputArea = page.locator('#typo-output');
    await expect(outputArea).toBeVisible();

    // Wait a brief moment for live update
    await page.waitForTimeout(500);

    const generatedText = await outputArea.textContent();
    expect(generatedText).not.toBeNull();
    expect(generatedText).not.toContain('Le texte transformé apparaîtra ici...');

    // Change rate slider to 50%
    const rateSlider = page.locator('#typo-rate');
    await rateSlider.fill('50');

    await page.waitForTimeout(500);
    const generatedTextHighRate = await outputArea.textContent();
    expect(generatedTextHighRate).not.toBeNull();
    // High rate should introduce distinct modifications compared to the input text
    expect(generatedTextHighRate).not.toEqual(sampleText);

    // Verify copy button works and triggers toast
    const copyButton = page.getByRole('button', { name: 'Copy', exact: true }).first();
    await copyButton.click();

    // Verify toast notification appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible();

    // Verify download button triggers download without crash
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download', exact: true }).first().click(),
    ]);
    expect(download.suggestedFilename()).toContain('text-typo-');

    // Click "Clear" button
    const clearButton = page.getByRole('button', { name: 'Clear', exact: true }).first();
    await clearButton.click();

    // Verify textarea is empty and focused
    await expect(inputArea).toBeEmpty();
    await expect(inputArea).toBeFocused();
  });
});
