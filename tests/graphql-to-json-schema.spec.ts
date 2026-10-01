import { test, expect } from '@playwright/test';

test.describe('GraphQL to JSON Schema Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-json-schema');
  });

  test('should render GraphQL to JSON Schema tool with header and options', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('GraphQL en JSON Schema');
    await expect(page.locator('#graphql-jsonschema-input')).toBeVisible();
    await expect(page.locator('#jsonschema-output')).toBeVisible();
    await expect(page.locator('#draft-version-select')).toBeVisible();
    await expect(page.locator('#id-type-select')).toBeVisible();
    await expect(page.locator('#nullable-mode-select')).toBeVisible();
  });

  test('should load preset and generate valid JSON Schema output', async ({ page }) => {
    // Click E-Commerce Catalog preset
    await page.click('button:has-text("Catalogue E-Commerce")');

    const inputVal = await page.inputValue('#graphql-jsonschema-input');
    expect(inputVal).toContain('type Product');

    const outputVal = await page.inputValue('#jsonschema-output');
    expect(outputVal).toContain('http://json-schema.org/draft-07/schema#');
    expect(outputVal).toContain('"definitions"');

    // Parse output JSON
    const parsed = JSON.parse(outputVal);
    expect(parsed.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(parsed.definitions.Category).toBeDefined();
    expect(parsed.definitions.Product.properties.title.type).toBe('string');
    expect(parsed.definitions.Product.properties.price.type).toBe('number');
  });

  test('should support changing draft spec and nullability mode', async ({ page }) => {
    await page.fill('#graphql-jsonschema-input', 'type User { id: ID! name: String email: String }');

    // Change draft version to 2020-12
    await page.selectOption('#draft-version-select', 'draft-2020-12');
    let outputVal = await page.inputValue('#jsonschema-output');
    expect(outputVal).toContain('https://json-schema.org/draft/2020-12/schema');

    // Change nullability mode to nullable: true
    await page.selectOption('#nullable-mode-select', 'nullable_prop');
    outputVal = await page.inputValue('#jsonschema-output');
    expect(outputVal).toContain('"nullable": true');
  });

  test('should handle copy and clear hotkeys correctly', async ({ page }) => {
    await page.fill('#graphql-jsonschema-input', 'type Simple { age: Int! }');
    await expect(page.locator('#jsonschema-output')).not.toHaveValue('');

    // Trigger clear via Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('#graphql-jsonschema-input')).toHaveValue('');
    await expect(page.locator('#jsonschema-output')).toHaveValue('');
  });
});
