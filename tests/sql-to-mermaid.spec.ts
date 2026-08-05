import { test, expect } from '@playwright/test';

test.describe('SQL to Mermaid ER Diagram Generator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the English route of our new tool using absolute URL
    await page.goto('http://localhost:5173/en/outil/sql-to-mermaid');
  });

  test('should load the page and parse default empty/custom SQL inputs successfully', async ({ page }) => {
    // Assert title and descriptions exist
    await expect(page.locator('h1')).toContainText('SQL to Mermaid ER Diagram');

    const inputArea = page.locator('#sql-ddl-input');
    const outputArea = page.locator('#mermaid-er-output');

    // Default placeholder or empty values
    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Type custom SQL
    const customSql = `
      CREATE TABLE departments (
        dept_id INT PRIMARY KEY,
        dept_name VARCHAR(100) NOT NULL
      );
      CREATE TABLE employees (
        emp_id INT PRIMARY KEY,
        dept_id INT REFERENCES departments(dept_id),
        full_name VARCHAR(150)
      );
    `;
    await inputArea.fill(customSql);

    // Verify parsed Mermaid diagram output
    await expect(outputArea).toContainText('erDiagram');
    await expect(outputArea).toContainText('departments {');
    await expect(outputArea).toContainText('employees {');
    await expect(outputArea).toContainText('departments ||--o{ employees : "fk_dept_id"');
  });

  test('should load blogging sample and verify structure and foreign keys mapping', async ({ page }) => {
    const outputArea = page.locator('#mermaid-er-output');

    // Click "Sample: Blogging App"
    const sampleBtn = page.getByRole('button', { name: /Sample: Blogging App/i });
    await sampleBtn.click();

    // Toast check
    await expect(page.locator('[data-sonner-toast]').last()).toBeVisible();

    // Verify entities exist in Mermaid output
    await expect(outputArea).toContainText('users {');
    await expect(outputArea).toContainText('posts {');
    await expect(outputArea).toContainText('comments {');

    // Verify relationships drawn
    await expect(outputArea).toContainText('users ||--o{ posts : "fk_author_id"');
    await expect(outputArea).toContainText('posts ||--o{ comments : "fk_post_id"');
    await expect(outputArea).toContainText('users ||--o{ comments : "fk_author_id"');
  });

  test('should toggle Include Data Types and modify output properties', async ({ page }) => {
    const inputArea = page.locator('#sql-ddl-input');
    const outputArea = page.locator('#mermaid-er-output');

    await inputArea.fill(`
      CREATE TABLE inventory (
        id INT PRIMARY KEY,
        item_qty INTEGER
      );
    `);

    // Initially Types should be included (e.g. "int" and "integer")
    await expect(outputArea).toContainText('int id PK');
    await expect(outputArea).toContainText('integer item_qty');

    // Uncheck "Include Data Types"
    const includeTypesCheckbox = page.locator('input[type="checkbox"]');
    await includeTypesCheckbox.uncheck();

    // Columns should fallback to "column" keyword instead of data types
    await expect(outputArea).toContainText('column id PK');
    await expect(outputArea).toContainText('column item_qty');
  });

  test('should test Clear button and verify focus restoration to the input field', async ({ page }) => {
    const inputArea = page.locator('#sql-ddl-input');
    const outputArea = page.locator('#mermaid-er-output');

    // Load sample
    await page.getByRole('button', { name: /Sample: Blogging App/i }).click();
    await expect(inputArea).not.toHaveValue('');

    // Click clear
    const clearBtn = page.getByRole('button', { name: /Clear/i }).first();
    await clearBtn.click();

    // Value should be empty
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');

    // Focus restored programmatically
    await expect(inputArea).toBeFocused();
  });

  test('should trigger keyboard shortcuts: Escape to clear and "c" to copy', async ({ page }) => {
    const inputArea = page.locator('#sql-ddl-input');
    const outputArea = page.locator('#mermaid-er-output');

    // Fill content
    await inputArea.fill(`CREATE TABLE test (val INT);`);
    await expect(outputArea).toContainText('erDiagram');

    // Unfocus any inputs to let the global keyboard shortcuts trigger
    await inputArea.blur();

    // Escape shortcut clears inputs
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // Load sample again, blur
    await page.getByRole('button', { name: /Sample: Blogging App/i }).click();
    await inputArea.blur();

    // "c" shortcut should trigger copying of diagram
    await page.keyboard.press('c');

    // Check success toast for copying
    const toast = page.locator('[data-sonner-toast]').last();
    await expect(toast).toBeVisible();
  });

  test('should load in French route and verify localized strings', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-mermaid');

    // Title should be translated
    await expect(page.locator('h1')).toContainText('SQL en Mermaid ER');

    // Controls must have French text
    await expect(page.getByRole('button', { name: /Exemple: Application de Blog/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Exemple: E-Commerce/i })).toBeVisible();
    await expect(page.locator('label[for="sql-ddl-input"]')).toContainText('SQL CREATE TABLE DDL');
    await expect(page.locator('label[for="mermaid-er-output"]')).toContainText('Diagramme ER Mermaid');
  });
});
