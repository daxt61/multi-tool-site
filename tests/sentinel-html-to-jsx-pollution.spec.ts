import { test, expect } from '@playwright/test';

test.describe('HTMLToJSX Prototype Pollution Security', () => {
  test('HTMLToJSX converts inline styles safely and filters out __proto__, constructor, and prototype properties', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/html-to-jsx');

    await page.waitForSelector('textarea#html-input');

    // Input HTML with malicious inline style containing __proto__ and constructor property keys
    const maliciousHTML = '<div style="color: red; __proto__: polluted; constructor: polluted; margin-top: 10px;">Test</div>';
    await page.fill('textarea#html-input', maliciousHTML);

    // Get JSX output text from the output pre tag
    const jsxOutput = await page.textContent('pre');

    // Ensure output contains legitimate CSS styles converted to camelCase
    expect(jsxOutput).toContain("color: 'red'");
    expect(jsxOutput).toContain("marginTop: '10px'");

    // Ensure dangerous prototype pollution property keys are completely excluded
    expect(jsxOutput).not.toContain('__proto__');
    expect(jsxOutput).not.toContain('constructor');
    expect(jsxOutput).not.toContain('prototype');
  });
});
