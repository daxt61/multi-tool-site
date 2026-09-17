import { test, expect } from '@playwright/test';

test.describe('Sentinel: JSONToPython Comment Breakout Security Test', () => {
  test('should sanitize user keys in comments to prevent single-line comment breakout', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/json-to-python`);

    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();

    // Key with multiline breaks and hash comment characters intended to break out into Python code
    const payload = JSON.stringify({
      "user_name\n  print('HACKED')\n#": "Alice",
      "user_email?>print('EXPLOIT')": "alice@example.com"
    }, null, 2);

    await jsonInput.fill(payload);

    const pythonOutput = page.locator('#python-output');
    await expect(pythonOutput).not.toHaveValue('');

    const outputText = await pythonOutput.inputValue();

    // Verify that newlines were stripped so code cannot break out of single-line comments
    expect(outputText).not.toContain("\n  print('HACKED')");
    expect(outputText).not.toContain("\nprint('EXPLOIT')");
    expect(outputText).toContain("user_name");
    expect(outputText).toContain("user_email");
    expect(outputText).toContain("# Original JSON key: user_name   print('HACKED')");
  });
});
