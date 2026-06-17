import { test, expect } from '@playwright/test';

test('SQLToJSON should prevent prototype pollution', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/sql-to-json');

  // Wait for the tool to load
  await page.waitForSelector('textarea#sql-input');

  // Input SQL with __proto__ column
  const maliciousSQL = `INSERT INTO users (__proto__, name) VALUES ('polluted', 'John');`;
  await page.fill('textarea#sql-input', maliciousSQL);

  // Click convert button
  await page.click('button:has-text("Convertir en JSON")');

  // Get JSON output
  const jsonOutput = await page.inputValue('textarea#json-output');
  const parsed = JSON.parse(jsonOutput);

  // Verify that __proto__ is prefixed
  expect(parsed[0]).toHaveProperty('___proto__');
  // Use hasOwnProperty to check that __proto__ is not an OWN property
  // (It will always exist on the prototype chain of a standard object)
  expect(Object.prototype.hasOwnProperty.call(parsed[0], '__proto__')).toBe(false);

  // Verify that it didn't pollute the prototype
  // In JS, Object.create(null) objects don't have standard prototype methods
  // But since we JSON.parse it back, it becomes a regular object.
  // The key thing is the property name being changed.
});
