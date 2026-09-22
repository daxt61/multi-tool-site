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

    // Ensure output contains legitimate CSS styles converted to camelCase and double-quoted JSON string literals
    expect(jsxOutput).toContain('color: "red"');
    expect(jsxOutput).toContain('marginTop: "10px"');

    // Ensure dangerous prototype pollution property keys are completely excluded
    expect(jsxOutput).not.toContain('__proto__');
    expect(jsxOutput).not.toContain('constructor');
    expect(jsxOutput).not.toContain('prototype');
  });

  test('HTMLToJSX safely escapes single quotes and colons in inline style values', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/html-to-jsx');

    await page.waitForSelector('textarea#html-input');

    // Input HTML with single quotes, colons, and code breakout attempts in style values
    const breakoutHTML = '<div style="font-family: \'Courier New\', monospace; background: url(\'http://example.com/a.png\'); content: \' + alert(1) + \';">Test</div>';
    await page.fill('textarea#html-input', breakoutHTML);

    const jsxOutput = await page.textContent('pre');

    // Ensure single quotes and colons are properly preserved/escaped via JSON.stringify
    expect(jsxOutput).toContain('fontFamily: "\'Courier New\', monospace"');
    expect(jsxOutput).toContain('background: "url(\'http://example.com/a.png\')"');
    expect(jsxOutput).toContain('content: "\' + alert(1) + \'"');
  });
});
