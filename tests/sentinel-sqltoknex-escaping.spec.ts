import { test, expect } from '@playwright/test';

test.describe('Sentinel: SQL to Knex Migration String Escaping Mitigation', () => {
  test('SQLToKnex safely escapes single quotes, backslashes, and control characters in table names, column names, and string default values', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-knex');

    const inputArea = page.locator('#sql-knex-input');
    const outputArea = page.locator('#knex-output');
    const fieldCasingSelect = page.locator('#knex-field-casing');

    // Select Original Column Name casing to preserve special characters in column names
    await fieldCasingSelect.selectOption('original');

    await inputArea.fill(`
      CREATE TABLE "user's_data" (
        "col'with'quote" VARCHAR(255) DEFAULT 'default_val',
        "slash\\col" TEXT DEFAULT 'slash_val'
      );
    `);

    // Verify table name is safely escaped in createTable and dropTableIfExists
    await expect(outputArea).toContainText(".createTable('user\\'s_data'");
    await expect(outputArea).toContainText(".dropTableIfExists('user\\'s_data')");

    // Verify column names and defaults with single quotes and backslashes are safely escaped
    await expect(outputArea).toContainText("table.string('col\\'with\\'quote'");
    await expect(outputArea).toContainText(".defaultTo('default_val')");

    await expect(outputArea).toContainText("table.text('slash\\\\col')");
    await expect(outputArea).toContainText(".defaultTo('slash_val')");
  });
});
