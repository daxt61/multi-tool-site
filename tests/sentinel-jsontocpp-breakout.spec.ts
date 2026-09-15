import { test, expect } from '@playwright/test';

test.describe('Sentinel Security Tests - JSON to C++ Identifier Breakout Prevention', () => {
  test('sanitizes numeric-starting keys and reserved keywords for C++ structs and fields', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/json-to-cpp`);

    const jsonInput = page.locator('#json-input');
    const cppOutput = page.locator('#cpp-output');

    const testPayload = JSON.stringify({
      "123Data": {
        "class": "A",
        "int": 42,
        "100_percent": true,
        "normal_key": "test"
      }
    });

    await jsonInput.fill(testPayload);

    await expect(cppOutput).not.toHaveValue('');
    const outputText = await cppOutput.inputValue();

    // Verify struct name for 123Data is prepended with Struct
    expect(outputText).toContain('struct Struct123data {');

    // Verify fields are properly sanitized against C++ reserved keywords and starting digits
    expect(outputText).toContain('std::string class_;');
    expect(outputText).toContain('int int_;');
    expect(outputText).toContain('bool f_100_percent;');
    expect(outputText).toContain('std::string normal_key;');
  });
});
