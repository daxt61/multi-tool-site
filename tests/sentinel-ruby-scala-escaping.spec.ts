import { test, expect } from '@playwright/test';

test.describe('Sentinel: Ruby and Scala Key Escaping', () => {
  test('JSONToRuby handles keywords and starting digits', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-ruby');

    const inputJson = JSON.stringify({
      "class": "hello",
      "123foo": 42
    });

    await page.fill('#json-input', inputJson);
    await page.waitForTimeout(1000);

    const output = await page.inputValue('#ruby-output');

    // "class" keyword should be mapped to "class_" and starting digit to "r_123foo"
    expect(output).toContain('attr_accessor :class_, :r_123foo');
    expect(output).toContain('def initialize(class_:, r_123foo:)');
    expect(output).toContain('@class_ = class_');
    expect(output).toContain('@r_123foo = r_123foo');
  });

  test('JSONToScala handles keywords and starting digits with backticks', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-scala');

    const inputJson = JSON.stringify({
      "type": "some-type",
      "123val": true
    });

    await page.fill('#json-input', inputJson);
    await page.waitForTimeout(1000);

    const output = await page.inputValue('#scala-output');

    // keywords and digits should be wrapped in backticks
    expect(output).toContain('`type`: String');
    expect(output).toContain('`123val`: Boolean');
  });
});
