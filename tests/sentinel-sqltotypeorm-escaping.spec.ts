import { test, expect } from '@playwright/test';

test.describe('Sentinel Security: SQL to TypeORM Escaping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-typeorm');
  });

  test('escapes single quotes, backslashes, and control characters in table names, column names, and default values', async ({ page }) => {
    const maliciousSql = `
CREATE TABLE "user's_data\\special" (
  "user_id" INT PRIMARY KEY,
  "user's_bio" VARCHAR(255) DEFAULT 'Hello \\'world\\'! \\n Breakout test',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
    `.trim();

    await page.fill('#sql-typeorm-input', maliciousSql);

    const outputVal = await page.locator('#typeorm-output').inputValue();

    // Verify @Entity decorator escapes quotes and backslashes
    expect(outputVal).toContain("@Entity('user\\'s_data\\\\special')");

    // Verify @Column decorator escapes column name
    expect(outputVal).toContain("name: 'user\\'s_bio'");

    // Verify default value string literal escaping
    expect(outputVal).toContain("default: 'Hello \\'world\\'! \\\\n Breakout test'");

    // Ensure generated code does not contain unescaped single quote breakout
    expect(outputVal).not.toContain("@Entity('user's");
  });
});
