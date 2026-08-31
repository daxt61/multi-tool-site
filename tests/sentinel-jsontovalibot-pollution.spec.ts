import { test, expect } from '@playwright/test';

test('JSONToValibot should sanitize dangerous prototype keys to prevent prototype pollution collisions', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-to-valibot');

  // Wait for textarea to be visible
  await page.waitForSelector('textarea#json-input');

  // Input JSON with dangerous keys
  const maliciousJson = JSON.stringify({
    "__proto__": 123,
    "constructor": "test",
    "prototype": true,
    "normalKey": "value"
  }, null, 2);

  await page.fill('textarea#json-input', maliciousJson);

  // Get the generated Valibot schema code
  const schemaOutput = await page.innerText('pre');

  // Verify that dangerous keys are prefixed with an underscore
  expect(schemaOutput).toContain('_constructor');
  expect(schemaOutput).toContain('_prototype');
  expect(schemaOutput).toContain('normalKey');

  // Verify it does not contain unsanitized dangerous object keys (matching exact word boundaries)
  expect(schemaOutput).not.toMatch(/(?<!_)\b__proto__\b:/);
  expect(schemaOutput).not.toMatch(/(?<!_)\bconstructor\b:/);
  expect(schemaOutput).not.toMatch(/(?<!_)\bprototype\b:/);
});
