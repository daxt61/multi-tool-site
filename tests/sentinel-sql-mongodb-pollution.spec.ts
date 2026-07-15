import { test, expect } from '@playwright/test';

test('SQLToMongoDB should prevent prototype pollution in INSERT statements', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/sql-to-mongodb');

  // Wait for the tool to load
  await page.waitForSelector('textarea#sql-input');

  // Input SQL with __proto__ column
  const maliciousSQL = `INSERT INTO users (__proto__, name) VALUES ('polluted', 'John');`;
  await page.fill('textarea#sql-input', maliciousSQL);

  // Click convert button
  await page.click('button:has-text("Convert to MongoDB")');

  // Get MongoDB output
  const mongoOutput = await page.inputValue('textarea#mongo-output');

  // We expect the dangerous key to be sanitized (prefixed with _)
  expect(mongoOutput).toContain('___proto__');
  expect(mongoOutput).not.toContain('"__proto__":');
});

test('SQLToMongoDB should prevent prototype pollution in SELECT statements', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/sql-to-mongodb');

  // Wait for the tool to load
  await page.waitForSelector('textarea#sql-input');

  // Input SQL with __proto__ in WHERE clause
  const maliciousSQL = `SELECT * FROM users WHERE __proto__ = 'polluted' AND name = 'John';`;
  await page.fill('textarea#sql-input', maliciousSQL);

  // Click convert button
  await page.click('button:has-text("Convert to MongoDB")');

  // Get MongoDB output
  const mongoOutput = await page.inputValue('textarea#mongo-output');

  // We expect the dangerous key to be sanitized
  expect(mongoOutput).toContain('___proto__');
  expect(mongoOutput).not.toContain('"__proto__":');
});

test('SQLToMongoDB should prevent prototype pollution in SELECT projections', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/sql-to-mongodb');

  // Wait for the tool to load
  await page.waitForSelector('textarea#sql-input');

  // Input SQL with __proto__ in projection
  const maliciousSQL = `SELECT __proto__, name FROM users;`;
  await page.fill('textarea#sql-input', maliciousSQL);

  // Click convert button
  await page.click('button:has-text("Convert to MongoDB")');

  // Get MongoDB output
  const mongoOutput = await page.inputValue('textarea#mongo-output');

  // We expect the dangerous key to be sanitized
  expect(mongoOutput).toContain('___proto__');
  expect(mongoOutput).not.toContain('"__proto__":');
});
