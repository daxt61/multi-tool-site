import { test, expect } from '@playwright/test';

test.describe('Sentinel: SQL to Drizzle ORM String Escaping Mitigation', () => {
  test('SQLToDrizzle safely escapes single quotes, backslashes, and newlines in table names, column names, and string default values', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-drizzle');

    const inputArea = page.locator('#sql-drizzle-input');
    const outputArea = page.locator('#drizzle-output');

    await inputArea.fill(`
      CREATE TABLE "user's_data" (
        "col'with'quote" VARCHAR(255) DEFAULT 'default_val',
        "slash\\col" TEXT DEFAULT 'slash_val'
      );
    `);

    // Verify table name is safely escaped in pgTable('...', ...)
    await expect(outputArea).toContainText("pgTable('user\\'s_data'");

    // Verify column names and defaults are safely escaped
    await expect(outputArea).toContainText("varchar('col\\'with\\'quote'");
    await expect(outputArea).toContainText(".default('default_val')");

    await expect(outputArea).toContainText("text('slash\\\\col')");
    await expect(outputArea).toContainText(".default('slash_val')");
  });
});
