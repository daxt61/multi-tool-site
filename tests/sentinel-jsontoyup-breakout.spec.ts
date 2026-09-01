import { test, expect } from '@playwright/test';

test.describe('Sentinel: JSON to Yup Key Breakout Prevention', () => {
  test('safely escapes special characters and quotes in JSON keys', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-yup');

    const maliciousJson = JSON.stringify({
      "normal_key": "hello",
      "key with spaces": "world",
      "key\"quote": 123,
      "key\nnewline": true,
      "key: breakout": null
    });

    const textarea = page.locator('#json-input');
    await textarea.fill(maliciousJson);

    const outputContainer = page.locator('pre');
    await expect(outputContainer).toContainText('"key with spaces": yup.string()');
    await expect(outputContainer).toContainText('"key\\"quote": yup.number()');
    await expect(outputContainer).toContainText('"key\\nnewline": yup.boolean()');
    await expect(outputContainer).toContainText('"key: breakout": yup.mixed().nullable()');
  });
});
