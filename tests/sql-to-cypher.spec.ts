import { test, expect } from '@playwright/test';

test.describe('SQL to Neo4j Cypher Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-cypher');
    await page.waitForSelector('#sql-cypher-input');
  });

  test('should render the SQL to Cypher tool interface correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL en Neo4j Cypher');
    await expect(page.locator('#sql-cypher-input')).toBeVisible();
    await expect(page.locator('#cypher-output')).toBeVisible();

    // Verify presets
    await expect(page.locator('button:has-text("E-Commerce Catalog")')).toBeVisible();
    await expect(page.locator('button:has-text("User Auth & Roles")')).toBeVisible();
    await expect(page.locator('button:has-text("Social Graph & Posts")')).toBeVisible();
  });

  test('should convert default SQL preset to Cypher MERGE queries', async ({ page }) => {
    const output = page.locator('#cypher-output');
    await expect(output).not.toHaveValue('');

    const outputText = await output.inputValue();
    expect(outputText).toContain('CREATE CONSTRAINT FOR (n:Categories) REQUIRE n.categoryId IS UNIQUE;');
    expect(outputText).toContain('MERGE (n:Categories { categoryId: 1 })');
    expect(outputText).toContain("SET n = { categoryId: 1, categoryName: 'Electronics' };");
    expect(outputText).toContain('MERGE (n:Products { productId: 101 })');
    expect(outputText).toContain('MATCH (n:Products) WHERE n.id = 101');
    expect(outputText).toContain('RETURN n;');
  });

  test('should support switching Cypher clause mode to CREATE', async ({ page }) => {
    await page.selectOption('#sql-cypher-mode', 'CREATE');

    const output = page.locator('#cypher-output');
    const outputText = await output.inputValue();
    expect(outputText).toContain("CREATE (:Categories { categoryId: 1, categoryName: 'Electronics' });");
    expect(outputText).toContain("CREATE (:Products { productId: 101, title: 'Wireless Headphones', price: 149.99, categoryId: 1 });");
  });

  test('should support changing node label and property casing', async ({ page }) => {
    await page.selectOption('#sql-cypher-label-casing', 'snake_case');
    await page.selectOption('#sql-cypher-prop-casing', 'snake_case');

    const output = page.locator('#cypher-output');
    const outputText = await output.inputValue();
    expect(outputText).toContain(':categories');
    expect(outputText).toContain(':products');
    expect(outputText).toContain('category_name');
  });

  test('should switch presets correctly', async ({ page }) => {
    await page.click('button:has-text("Social Graph & Posts")');

    const input = page.locator('#sql-cypher-input');
    await expect(input).toHaveValue(/CREATE TABLE posts/);

    const output = page.locator('#cypher-output');
    const outputText = await output.inputValue();
    expect(outputText).toContain(':Posts');
    expect(outputText).toContain(':Users');
    expect(outputText).toContain("john_doe");
  });

  test('should handle clear and keyboard shortcuts', async ({ page }) => {
    await page.focus('#sql-cypher-input');
    await page.keyboard.press('Escape');

    await expect(page.locator('#sql-cypher-input')).toHaveValue('');
    await expect(page.locator('#cypher-output')).toHaveValue('');
  });
});
