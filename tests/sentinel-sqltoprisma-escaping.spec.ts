import { test, expect } from '@playwright/test';

test.describe('Sentinel: SQL to Prisma String Literal Escaping Mitigation', () => {
  test('SQLToPrisma safely escapes double quotes, backslashes, and control characters in default values and map attributes', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-prisma');

    const inputArea = page.locator('#sql-prisma-input');
    const outputArea = page.locator('#prisma-schema-output');

    await inputArea.fill(`
      CREATE TABLE user_data (
        id INT PRIMARY KEY,
        user_bio VARCHAR(255) DEFAULT 'quote"val\\nand\\\\slash'
      );
    `);

    // Verify output area contains escaped double quotes and backslashes in Prisma attributes
    await expect(outputArea).toHaveValue(/@default\("quote\\"val\\\\nand\\\\\\\\slash"\)/);
    await expect(outputArea).toHaveValue(/@map\("user_bio"\)/);
  });
});
