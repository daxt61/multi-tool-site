import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('XML Formatter E2E and UX', () => {
  test('should load the page, layout, i18n, and perform formatting', async ({ page }) => {
    // Go to French version
    await page.goto(`${BASE_URL}/fr/outil/xml-formatter`);

    // Wait for the tool load
    await expect(page.locator('h1')).toContainText("Formateur XML");
    await expect(page.locator('label[for="xml-input"]')).toContainText("Éditeur XML");

    // Check textarea placeholder
    const textarea = page.locator('textarea#xml-input');
    await expect(textarea).toBeVisible();

    // Input some unformatted XML
    await textarea.fill("<note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don't forget me this weekend!</body></note>");

    // Click "Embellir" (Beautify)
    await page.click('button:has-text("Embellir")');

    // Expected formatted XML structure with indentation
    const outputValue = await textarea.inputValue();
    expect(outputValue).toContain('<note>');
    expect(outputValue).toContain('  <to>Tove</to>');

    // Click "Minifier"
    await page.click('button:has-text("Minifier")');
    const minifiedValue = await textarea.inputValue();
    expect(minifiedValue).toBe("<note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don&#039;t forget me this weekend!</body></note>");

    // Check i18n switcher to English
    await page.goto(`${BASE_URL}/en/outil/xml-formatter`);
    await expect(page.locator('h1')).toContainText("XML Formatter");
    await expect(page.locator('label[for="xml-input"]')).toContainText("XML Editor");
    await expect(page.locator('button:has-text("Beautify")')).toBeVisible();
    await expect(page.locator('button:has-text("Minify")')).toBeVisible();

    // Test clear behavior
    await page.click('button:has-text("Clear")');
    await expect(textarea).toHaveValue("");
    await expect(textarea).toBeFocused();
  });

  test('should support keyboard shortcuts Escape and C', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/xml-formatter`);

    const textarea = page.locator('textarea#xml-input');
    await textarea.fill('<test>hello</test>');

    // Format first
    await page.click('button:has-text("Beautify")');

    // Click outside textarea to focus body
    await page.locator('h1').click();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(textarea).toHaveValue("");
    await expect(textarea).toBeFocused();
  });
});
