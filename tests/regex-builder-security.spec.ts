import { test, expect } from '@playwright/test';

test.describe('RegexBuilder Security - Snippet Injection & PHP Interpolation', () => {
  test('safely escapes special characters and PHP variable interpolation in generated code snippets', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/regex-builder');

    // Enter test text with PHP variables, backslashes, double quotes, and template strings
    const testInput = page.locator('#test-text');
    await testInput.fill('user $secret_key = "12345"; `rm -rf /` """python""');

    // Select PHP language snippet
    const languageSelect = page.locator('#language-select');
    await languageSelect.selectOption('php');

    const snippetOutput = page.locator('#snippet-output');
    const phpSnippet = await snippetOutput.innerText();

    // Verify PHP string uses single quotes to prevent $secret_key interpolation
    expect(phpSnippet).toContain("$text = 'user $secret_key = \"12345\"; `rm -rf /` \"\"\"python\"\"';");

    // Select JavaScript language snippet
    await languageSelect.selectOption('js');
    const jsSnippet = await snippetOutput.innerText();

    // Verify JS string is safely stringified using JSON.stringify (double quotes, escaped)
    expect(jsSnippet).toContain('const text = "user $secret_key = \\"12345\\"; `rm -rf /` \\"\\"\\"python\\"\\"";');

    // Select Python language snippet
    await languageSelect.selectOption('python');
    const pySnippet = await snippetOutput.innerText();

    // Verify Python string is safely stringified
    expect(pySnippet).toContain('text = "user $secret_key = \\"12345\\"; `rm -rf /` \\"\\"\\"python\\"\\"\"');
  });
});
