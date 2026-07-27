import { test, expect } from '@playwright/test';

test.describe('SQL to TypeScript Upgraded Tool', () => {

  test('should parse SQL with comments, handle reserved words and trigger shortcuts', async ({ page }) => {
    // Navigate to SQL to TypeScript tool (French page)
    await page.goto('http://localhost:5173/fr/outil/sql-to-typescript');

    // Wait for elements to load
    await page.waitForSelector('textarea#sql-input');

    // 1. Verify Localization of labels
    const inputLabel = page.locator('label[for="sql-input"]');
    await expect(inputLabel).toContainText('Saisie SQL (CREATE TABLE)');

    const outputLabel = page.locator('label[for="ts-output"]');
    await expect(outputLabel).toContainText('Interfaces TypeScript');

    // 2. Input SQL with line comments, block comments, and standard/reserved table names
    const testSQL = `
      -- Table for system users
      CREATE TABLE users (
        id INT NOT NULL, -- unique id
        /* login name of user */
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255)
      );

      -- Table with reserved word name
      CREATE TABLE constructor (
        name VARCHAR(100) NOT NULL
      );
    `;

    await page.fill('textarea#sql-input', testSQL);

    // Get TypeScript output
    const tsOutput = await page.inputValue('textarea#ts-output');

    // Verify comments are stripped and not parsed as fields
    expect(tsOutput).not.toContain('--');
    expect(tsOutput).not.toContain('unique id');
    expect(tsOutput).not.toContain('login name');

    // Verify correct fields generated for users
    expect(tsOutput).toContain('export interface Users {');
    expect(tsOutput).toContain('  id: number;');
    expect(tsOutput).toContain('  username: string;');
    expect(tsOutput).toContain('  email?: string;');

    // Verify reserved word tableName is sanitized (e.g., constructor -> IConstructor)
    expect(tsOutput).toContain('export interface IConstructor {');
    expect(tsOutput).toContain('  name: string;');

    // 3. Test keyboard shortcuts: Escape to clear
    // Focus the input area and press Escape (should clear everything and focus the input field)
    await page.focus('textarea#sql-input');
    await page.keyboard.press('Escape');

    // Verify fields are empty
    await expect(page.locator('textarea#sql-input')).toHaveValue('');
    await expect(page.locator('textarea#ts-output')).toHaveValue('');

    // Input some text again to test copy shortcut
    await page.fill('textarea#sql-input', 'CREATE TABLE test (val INT);');
    // Blur from any textareas
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
    });

    // Press C to copy (when not focused on any input)
    await page.keyboard.press('c');

    // Verify success toast exists (standard toast or copied status)
    const toast = page.locator('li[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();

    // Verify clipboard content if possible, or just the copied state
    const tsOutputAfter = await page.inputValue('textarea#ts-output');
    expect(tsOutputAfter).toContain('export interface Test {');
    expect(tsOutputAfter).toContain('  val?: number;');
  });

  test('should handle language toggle correctly', async ({ page }) => {
    // Navigate to SQL to TypeScript tool (English page)
    await page.goto('http://localhost:5173/en/outil/sql-to-typescript');

    const inputLabel = page.locator('label[for="sql-input"]');
    await expect(inputLabel).toContainText('SQL Input (CREATE TABLE)');

    const outputLabel = page.locator('label[for="ts-output"]');
    await expect(outputLabel).toContainText('TypeScript Interfaces');
  });

});
