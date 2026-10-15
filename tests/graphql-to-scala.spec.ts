import { test, expect } from '@playwright/test';

test.describe('GraphQL SDL to Scala Converter and Kotlin Escaping', () => {
  test('converts GraphQL SDL to Scala 3 case classes with Circe annotations and presets', async ({ page }) => {
    // Navigate directly to tool route
    await page.goto('http://localhost:4173/en/outil/graphql-to-scala');

    // Verify UI components
    await expect(page.locator('#graphql-scala-input')).toBeVisible();
    await expect(page.locator('#scala-output')).toBeVisible();

    // Click E-Commerce Catalog preset
    const ecommercePreset = page.locator('button', { hasText: 'E-Commerce Catalog' });
    await expect(ecommercePreset).toBeVisible();
    await ecommercePreset.click();

    // Verify active preset attribute
    await expect(ecommercePreset).toHaveAttribute('aria-pressed', 'true');

    // Check generated output in Scala 3 mode (default)
    const outputText = await page.locator('#scala-output').inputValue();
    expect(outputText).toContain('package com.example.graphql.model');
    expect(outputText).toContain('@JsonCodec');
    expect(outputText).toContain('final case class Product(');
    expect(outputText).toContain('enum OrderStatus:');
    expect(outputText).toContain('case PENDING');

    // Switch to Scala 2.13 mode
    await page.selectOption('#scala-version', 'scala2');
    const scala2Output = await page.locator('#scala-output').inputValue();
    expect(scala2Output).toContain('sealed trait OrderStatus');
    expect(scala2Output).toContain('case object PENDING extends OrderStatus');

    // Switch to Play JSON framework
    await page.selectOption('#json-framework', 'play');
    const playOutput = await page.locator('#scala-output').inputValue();
    expect(playOutput).toContain('import play.api.libs.json._');
    expect(playOutput).toContain('implicit val format: OFormat[Product] = Json.format[Product]');
  });

  test('escapes Scala keywords using backticks', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-scala');

    const schemaWithKeywords = `
type Event {
  id: ID!
  type: String!
  yield: Float!
}
`;

    await page.fill('#graphql-scala-input', schemaWithKeywords);

    const outputText = await page.locator('#scala-output').inputValue();
    expect(outputText).toContain('`type`: String');
    expect(outputText).toContain('`yield`: Double');
  });

  test('supports keyboard shortcuts and clear button', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-scala');

    await page.click('button:has-text("E-Commerce Catalog")');
    expect(await page.locator('#graphql-scala-input').inputValue()).not.toBe('');

    // Focus input and trigger Escape
    await page.locator('#graphql-scala-input').focus();
    await page.keyboard.press('Escape');

    // Verify cleared input
    await expect(page.locator('#graphql-scala-input')).toHaveValue('');
    await expect(page.locator('#scala-output')).toHaveValue('');
  });

  test('verifies Kotlin escaping fix in GraphQL to Kotlin tool', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-kotlin');

    const schemaWithQuote = `
type User {
  id: ID!
  quote_name: String!
}
`;

    await page.fill('#graphql-kotlin-input', schemaWithQuote);
    const output = await page.locator('#kotlin-output').inputValue();
    expect(output).toContain('@SerialName("quote_name")');
  });
});
