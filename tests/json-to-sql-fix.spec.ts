import { test, expect } from '@playwright/test';

test.describe('JSON to SQL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-sql');
  });

  test('should handle nested objects', async ({ page }) => {
    const input = JSON.stringify({
      id: 1,
      metadata: { key: "value" },
      tags: ["a", "b"]
    });

    await page.fill('#json-input', input);
    await page.click('button:has-text("Generate SQL")');

    const output = await page.inputValue('#sql-output');
    expect(output).toContain('INSERT INTO "users" ("id", "metadata", "tags")');
    expect(output).toContain("'{\"key\":\"value\"}'");
    expect(output).toContain("'[\"a\",\"b\"]'");
  });
});
