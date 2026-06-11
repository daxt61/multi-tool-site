import { test, expect } from '@playwright/test';

test.describe('JSON to Pydantic Security', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-pydantic');
  });

  test('should handle deeply nested JSON without crashing (DoS protection)', async ({ page }) => {
    // Generate a deeply nested JSON object (100 levels)
    let nested: any = { leaf: "value" };
    for (let i = 0; i < 100; i++) {
      nested = { [`level${i}`]: nested };
    }
    const input = JSON.stringify(nested);

    await page.fill('#json-input', input);

    // If it didn't crash, we should be able to see the output
    const output = await page.inputValue('#pydantic-output');

    // It should contain 'Any' due to depth limit (MAX_DEPTH = 20)
    expect(output).toContain('Any');

    // Verify it didn't crash the page (check if clear button still works)
    await page.click('button:has-text("Clear")');
    const inputValue = await page.inputValue('#json-input');
    expect(inputValue).toBe('');
  });
});
