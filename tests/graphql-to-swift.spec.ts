import { test, expect } from '@playwright/test';

test.describe('GraphQL to Swift Codable Converter Tool Suite', () => {
  test('GraphQLToSwift converts GraphQL SDL into Swift Codable structs, classes, enums, unions and CodingKeys', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-swift');
    await expect(page.locator('h1')).toContainText('GraphQL to Swift Codable');

    const inputArea = page.locator('#graphql-swift-input');
    const outputArea = page.locator('#swift-output');

    // 1. Convert struct model
    await inputArea.fill(`
      type Product {
        id: ID!
        title: String!
        price: Float!
        description: String
        is_active: Boolean!
        tags: [String!]!
      }
    `);

    await expect(outputArea).toContainText('import Foundation');
    await expect(outputArea).toContainText('public struct Product: Codable, Sendable, Identifiable');
    await expect(outputArea).toContainText('public var id: String');
    await expect(outputArea).toContainText('public var title: String');
    await expect(outputArea).toContainText('public var price: Double');
    await expect(outputArea).toContainText('public var `description`: String?');
    await expect(outputArea).toContainText('public var isActive: Bool');
    await expect(outputArea).toContainText('public var tags: [String]');
    await expect(outputArea).toContainText('enum CodingKeys: String, CodingKey');
    await expect(outputArea).toContainText('case isActive = "is_active"');

    // 2. Switch to final class model
    const constructSelect = page.locator('#model-construct');
    await constructSelect.selectOption('class');

    await expect(outputArea).toContainText('public final class Product: Codable, Sendable, Identifiable');

    // 3. Test presets and active preset aria-pressed attribute
    const userAuthPresetBtn = page.locator('button:has-text("User Management & Auth")');
    await userAuthPresetBtn.click();
    await expect(userAuthPresetBtn).toHaveAttribute('aria-pressed', 'true');

    await expect(inputArea).toContainText('enum Role');
    await expect(outputArea).toContainText('public enum Role: String, Codable, Sendable');
    await expect(outputArea).toContainText('public final class User: Codable, Sendable, Identifiable');

    // 4. Test keyboard shortcuts (Escape to clear, focus restoration)
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
