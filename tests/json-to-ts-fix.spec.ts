import { test, expect } from '@playwright/test';

test.describe('JSON to TS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-ts');
  });

  test('should infer mixed array types', async ({ page }) => {
    const input = JSON.stringify({
      mixed: [1, "two", true]
    });

    await page.fill('#json-input', input);

    const output = await page.inputValue('#ts-output');
    expect(output).toContain('mixed: (number | string | boolean)[];');
  });
});
