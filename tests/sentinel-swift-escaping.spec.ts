import { test, expect } from '@playwright/test';

test.describe('Sentinel: Swift Generator String Escaping Security Tests', () => {
  test('SQLToSwift generates CodingKeys enum for snake_case column mapping', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-swift');

    const sql = `
      CREATE TABLE injection_test (
        id INT PRIMARY KEY,
        bad_column_name VARCHAR(255) NOT NULL,
        interp_test VARCHAR(100) NOT NULL
      );
    `;

    await page.locator('#sql-swift-input').fill(sql);

    const output = await page.locator('#swift-output').inputValue();

    // Verify output contains CodingKeys enum mapping
    expect(output).toContain('enum CodingKeys: String, CodingKey');
    expect(output).toContain('case badColumnName = "bad_column_name"');
    expect(output).toContain('case interpTest = "interp_test"');
  });

  test('JSONToSwift correctly escapes double quotes and backslashes in CodingKeys', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-swift');

    const maliciousJson = JSON.stringify({
      "user_id": 1,
      "nested\\\"key": "value"
    });

    await page.locator('#json-input').fill(maliciousJson);

    const output = await page.locator('#swift-output').inputValue();

    // Verify output contains properly escaped strings in CodingKeys enum
    expect(output).toContain('enum CodingKeys: String, CodingKey');
    expect(output).toContain('case nestedKey = "nested\\\\\\"key"');
  });
});
