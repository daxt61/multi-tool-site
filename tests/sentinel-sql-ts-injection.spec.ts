import { test, expect } from '@playwright/test';

test('SQLToTypeScript should sanitize property names to prevent injection', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/sql-to-typescript');

  // Wait for the tool to load
  await page.waitForSelector('textarea#sql-input');

  // Input SQL with malicious column names
  const maliciousSQL = `CREATE TABLE users (
    "id" INT PRIMARY KEY,
    "user name" VARCHAR(255),
    "user:role" VARCHAR(50),
    "user\\"quote" TEXT
  );`;
  await page.fill('textarea#sql-input', maliciousSQL);

  // Get TypeScript output
  const tsOutput = await page.inputValue('textarea#ts-output');

  // Verify that property names are correctly sanitized/quoted
  expect(tsOutput).toContain('  id?: number;');
  expect(tsOutput).toContain('  "user name"?: string;');
  expect(tsOutput).toContain('  "user:role"?: string;');
  expect(tsOutput).toContain('  "user\\\\\\"quote"?: string;');

  // Verify interface syntax integrity
  expect(tsOutput).toContain('export interface Users {');
  expect(tsOutput.endsWith('}')).toBe(true);
});
