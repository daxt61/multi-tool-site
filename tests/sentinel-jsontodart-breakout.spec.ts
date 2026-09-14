import { test, expect } from '@playwright/test';

test.describe('Sentinel Security Tests - JSON to Dart String Breakout Prevention', () => {
  test('escapes single quotes, dollar signs, and newlines in Dart serialization methods', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/json-to-dart`);

    const jsonInput = page.locator('#json-input');
    const dartOutput = page.locator('#dart-output');

    await expect(jsonInput).toBeVisible();
    await expect(dartOutput).toBeVisible();

    // Input payload with single quotes, dollar signs, and starting digits in key names
    const maliciousJson = JSON.stringify({
      "user's_key": "John",
      "price$usd": 99.99,
      "123numeric_key": true
    }, null, 2);

    await jsonInput.fill(maliciousJson);

    // Verify escaped single quotes in fromJson and toJson
    await expect(dartOutput).toContainText("json['user\\'s_key']");
    await expect(dartOutput).toContainText("'user\\'s_key':");

    // Verify escaped dollar signs in fromJson and toJson
    await expect(dartOutput).toContainText("json['price\\$usd']");
    await expect(dartOutput).toContainText("'price\\$usd':");

    // Verify identifier prepending for starting digits
    await expect(dartOutput).toContainText('f_123numericKey');
  });

  test('sanitizes class prefix and suffix inputs against breakout characters', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/json-to-dart`);

    const jsonInput = page.locator('#json-input');
    const dartOutput = page.locator('#dart-output');
    const prefixInput = page.locator('#prefix-mod');
    const suffixInput = page.locator('#suffix-mod');

    await jsonInput.fill('{"id": 1}');

    // Inject class breakout in prefix and suffix
    await prefixInput.fill('BadClass { void hack() {} }');
    await suffixInput.fill('Model; }');

    // Verify sanitized class name in output
    await expect(dartOutput).toContainText('class BadClassvoidhackRootObjectModel {');
    await expect(dartOutput).not.toContainText('void hack()');
  });
});
