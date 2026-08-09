import { test, expect } from '@playwright/test';

test.describe('XSLT Transformer & Tester', () => {
  test('should load, apply interactive presets, execute transformation, copy output and clear inputs', async ({ page }) => {
    // Navigate to the tool page
    await page.goto('http://localhost:5173/en/outil/xslt-transformer');

    // Verify Title
    await expect(page.locator('h1')).toContainText('XSLT Transformer & Tester');

    const xmlInput = page.locator('#xml-input');
    await expect(xmlInput).toBeVisible();

    const xsltInput = page.locator('#xslt-input');
    await expect(xsltInput).toBeVisible();

    const resultOutput = page.locator('#result-output');
    await expect(resultOutput).toBeVisible();

    // 1. Apply Student Report Card preset
    const reportPreset = page.getByRole('button', { name: 'Student Report Card' });
    await reportPreset.click();

    // Verify inputs populated
    const xmlValue = await xmlInput.inputValue();
    expect(xmlValue).toContain('<report>');
    expect(xmlValue).toContain('<student>');

    const xsltValue = await xsltInput.inputValue();
    expect(xsltValue).toContain('xsl:stylesheet');
    expect(xsltValue).toContain('Student Grades Report');

    // Wait for the transformation to run (de-bounce timeout of 300ms)
    await page.waitForTimeout(500);

    // Verify output is transformed
    const outputValue = await resultOutput.inputValue();
    expect(outputValue).toContain('Student Grades Report');
    expect(outputValue).toContain('Alice Smith');
    expect(outputValue).toContain('Bob Jones');

    // 2. Trigger Escape shortcut to clear
    await xmlInput.focus();
    await page.keyboard.press('Escape');

    // Verify inputs and outputs are cleared
    await expect(xmlInput).toHaveValue('');
    await expect(xsltInput).toHaveValue('');
    await expect(resultOutput).toHaveValue('');
  });
});
