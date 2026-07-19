import { test, expect } from '@playwright/test';

test.describe('Sentinel: C++ Key Escaping', () => {
  test('JSONToCPP handles keywords and starting digits', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-cpp');

    const inputJson = JSON.stringify({
      "class": "hello",
      "123foo": 42
    });

    await page.fill('#json-input', inputJson);
    await page.waitForTimeout(1000);

    const output = await page.inputValue('#cpp-output');

    // "class" keyword should be mapped to "class_" and starting digit to "f_123foo"
    expect(output).toContain('std::string class_;');
    expect(output).toContain('int f_123foo;');
  });
});
