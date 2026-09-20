import { test, expect } from '@playwright/test';

test('JSONToQuery should ignore prototype-polluting query keys case-insensitively', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/json-to-query');

  // Wait for query input textarea to be visible
  await page.waitForSelector('textarea#query-output');

  // Query string with uppercase/mixed case prototype keys
  const maliciousQuery = 'CONSTRUCTOR[polluted]=true&__PROTO__[polluted]=true&PROTOTYPE[polluted]=true&safe=value';

  await page.fill('textarea#query-output', maliciousQuery);

  // Get converted JSON
  const jsonOutput = await page.inputValue('textarea#json-input');

  // Verify safe key exists in output JSON
  expect(jsonOutput).toContain('"safe": "value"');

  // Verify polluted prototype keys are completely ignored and skipped
  expect(jsonOutput).not.toContain('polluted');
  expect(jsonOutput).not.toContain('CONSTRUCTOR');
  expect(jsonOutput).not.toContain('__PROTO__');
  expect(jsonOutput).not.toContain('PROTOTYPE');
});
