import { test, expect } from '@playwright/test';

test('JSONToBigQuery should sanitize field names and prevent prototype pollution', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-to-bigquery');

  // Wait for textarea to be visible
  await page.waitForSelector('textarea#json-input');

  // Input raw JSON string with dangerous prototype keys, starting digits, and special characters
  const inputPayload = `[
  {
    "__proto__": { "polluted": true },
    "123-id": 456,
    "user name": "Alice",
    "valid_field": "test"
  }
]`;

  await page.fill('textarea#json-input', inputPayload);
  await page.click('button:has-text("Convertir")');

  // Get the generated BigQuery schema JSON
  const outputTextarea = page.locator('textarea#bq-output');
  await expect(outputTextarea).not.toHaveValue('');

  const outputValue = await outputTextarea.inputValue();
  const parsedSchema = JSON.parse(outputValue);

  const fieldNames = parsedSchema.map((f: any) => f.name);

  // Check sanitized field names
  expect(fieldNames).toContain('___proto__');
  expect(fieldNames).toContain('_123_id');
  expect(fieldNames).toContain('user_name');
  expect(fieldNames).toContain('valid_field');

  // Verify none of the raw invalid field names exist
  expect(fieldNames).not.toContain('__proto__');
  expect(fieldNames).not.toContain('123-id');
  expect(fieldNames).not.toContain('user name');
});
