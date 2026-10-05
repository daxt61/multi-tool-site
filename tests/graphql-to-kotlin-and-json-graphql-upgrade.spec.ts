import { test, expect } from '@playwright/test';

test.describe('GraphQL to Kotlin & JSON to GraphQL Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr');
  });

  test('GraphQLToKotlin converts SDL schema into Kotlin data classes with kotlinx.serialization', async ({ page }) => {
    await page.goto('/fr/outil/graphql-to-kotlin');

    await expect(page.locator('h1')).toContainText('GraphQL en Kotlin');

    const inputArea = page.locator('#graphql-kotlin-input');
    await expect(inputArea).toBeVisible();

    const sampleGql = `
type Product {
  id: ID!
  name: String!
  price: Float!
  tags: [String!]
  createdAt: DateTime!
}

enum Status {
  ACTIVE
  INACTIVE
}

union SearchResult = Product | Status
    `.trim();

    await inputArea.fill(sampleGql);

    const outputArea = page.locator('#kotlin-output');
    await expect(outputArea).not.toHaveValue('');

    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('@Serializable');
    expect(outputVal).toContain('data class Product');
    expect(outputVal).toContain('val id: String');
    expect(outputVal).toContain('val price: Double');
    expect(outputVal).toContain('enum class Status');
    expect(outputVal).toContain('sealed interface SearchResult');

    // Test serialization option change to Jackson
    const serializationSelect = page.locator('#serialization-framework');
    await serializationSelect.selectOption('jackson');

    const jacksonVal = await outputArea.inputValue();
    expect(jacksonVal).toContain('@JsonProperty');
    expect(jacksonVal).toContain('@JsonTypeInfo');
  });

  test('JSONToGraphQL converts top-level array correctly and supports presets', async ({ page }) => {
    await page.goto('/fr/outil/json-to-graphql');

    await expect(page.locator('h1')).toContainText('JSON en GraphQL');

    // Test preset loading
    const presetBtn = page.getByRole('button', { name: 'Profil Utilisateur JSON' });
    await presetBtn.click();

    const inputArea = page.locator('#json-input');
    await expect(inputArea).not.toHaveValue('');

    const outputArea = page.locator('#graphql-output');
    await expect(outputArea).not.toHaveValue('');

    let outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('type RootObject');
    expect(outputVal).toContain('username: String');

    // Test top-level JSON array
    await inputArea.fill('[{"id": 1, "title": "Test Item"}]');
    outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('type RootQuery');
    expect(outputVal).toContain('items: [Item]');
    expect(outputVal).toContain('type Item');
    expect(outputVal).toContain('title: String');
  });
});
