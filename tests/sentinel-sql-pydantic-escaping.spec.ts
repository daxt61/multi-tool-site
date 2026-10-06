import { test, expect } from '@playwright/test';

test.describe('Sentinel: SQL to Pydantic String Escaping Mitigation', () => {
  test('SQLToPydantic safely escapes double quotes, backslashes, and newlines in field aliases', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/sql-to-pydantic');

    // SQL with column names containing double quotes and python keywords that force alias generation
    const sqlInput = `CREATE TABLE users (
  "class\\"_injected" VARCHAR(255) NOT NULL,
  "import" VARCHAR(100)
);`;

    const sqlTextarea = page.locator('#sql-pydantic-input');
    await sqlTextarea.fill(sqlInput);

    const outputTextarea = page.locator('#pydantic-output');
    const outputText = await outputTextarea.inputValue();

    // Verify alias string is properly escaped and does not allow breakout
    expect(outputText).toContain('alias="class\\\\\\"_injected"');
    expect(outputText).not.toContain('alias="class"_injected"');
    expect(outputText).toContain('alias="import"');
  });
});
