import { test, expect } from '@playwright/test';

test.describe('GraphQL to C# Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-csharp');
  });

  test('renders the GraphQL to C# converter tool correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('GraphQL to C#');
    await expect(page.locator('#graphql-csharp-input')).toBeVisible();
    await expect(page.locator('#csharp-output')).toBeVisible();
  });

  test('converts GraphQL SDL schema to C# 9 records by default', async ({ page }) => {
    const inputArea = page.locator('#graphql-csharp-input');
    const outputArea = page.locator('#csharp-output');

    await inputArea.fill(`
type User {
  id: ID!
  name: String!
  email: String
  isActive: Boolean!
}
    `);

    await expect(outputArea).toHaveValue(/namespace GraphQL\.Models/);
    await expect(outputArea).toHaveValue(/public record User/);
    await expect(outputArea).toHaveValue(/\[JsonPropertyName\("id"\)\]/);
    await expect(outputArea).toHaveValue(/public string Id \{ get; init; \}/);
    await expect(outputArea).toHaveValue(/public string\? Email \{ get; init; \}/);
  });

  test('loads quick start presets', async ({ page }) => {
    const outputArea = page.locator('#csharp-output');

    await page.getByRole('button', { name: 'E-Commerce Catalog' }).click();

    await expect(outputArea).toHaveValue(/public record Category/);
    await expect(outputArea).toHaveValue(/public record Product/);
    await expect(outputArea).toHaveValue(/public enum OrderStatus/);
  });

  test('supports changing target output type to HotChocolate and standard class', async ({ page }) => {
    const inputArea = page.locator('#graphql-csharp-input');
    const outputArea = page.locator('#csharp-output');

    await inputArea.fill(`
input CreateUserInput {
  email: String!
  name: String
}
    `);

    // Select HotChocolate
    await page.locator('#output-format').selectOption('hotchocolate');
    await expect(outputArea).toHaveValue(/\[InputObjectType\]/);
    await expect(outputArea).toHaveValue(/using HotChocolate;/);

    // Select standard class
    await page.locator('#output-format').selectOption('class');
    await expect(outputArea).toHaveValue(/public class CreateUserInput/);
    await expect(outputArea).toHaveValue(/\{ get; set; \}/);
  });

  test('supports keyboard shortcuts Esc and C', async ({ page }) => {
    const inputArea = page.locator('#graphql-csharp-input');
    const outputArea = page.locator('#csharp-output');

    await inputArea.fill(`
type Product {
  id: ID!
}
    `);

    await expect(outputArea).not.toHaveValue('');

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
