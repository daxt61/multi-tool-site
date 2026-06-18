import { test, expect } from '@playwright/test';

test('ASCIITableToJson should prevent prototype pollution', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/ascii-table-to-json');

  // Wait for the tool to load
  await page.waitForSelector('textarea#table-input');

  // Input table with __proto__ header
  const maliciousTable = `
| __proto__ | normal |
|-----------|--------|
| {"polluted": true} | val |
`;
  await page.fill('textarea#table-input', maliciousTable);

  // Get JSON output
  const jsonOutput = await page.inputValue('textarea#json-output');
  const parsed = JSON.parse(jsonOutput);

  // Verify that __proto__ is prefixed
  expect(parsed[0]).toHaveProperty('___proto__');

  // Verify that __proto__ is not an OWN property
  expect(Object.prototype.hasOwnProperty.call(parsed[0], '__proto__')).toBe(false);

  // Verify the value was captured under the safe key
  expect(parsed[0]['___proto__']).toBe('{"polluted": true}');
});
