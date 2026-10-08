import { test, expect } from '@playwright/test';

test.describe('GraphQL to Dart Converter Tool Suite', () => {
  test('GraphQLToDart converts GraphQL SDL into plain Dart classes, json_serializable, and freezed models', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-dart');
    await expect(page.locator('h1')).toContainText('GraphQL to Dart');

    const inputArea = page.locator('#graphql-dart-input');
    const outputArea = page.locator('#dart-output');

    // 1. Plain Dart Class mode
    await inputArea.fill(`
      type Product {
        id: ID!
        title: String!
        price: Float!
        description: String
        tags: [String!]!
      }
    `);

    await expect(outputArea).toContainText('class Product');
    await expect(outputArea).toContainText('final String id;');
    await expect(outputArea).toContainText('final String title;');
    await expect(outputArea).toContainText('final double price;');
    await expect(outputArea).toContainText('final String? description;');
    await expect(outputArea).toContainText('factory Product.fromJson');
    await expect(outputArea).toContainText('Map<String, dynamic> toJson');
    await expect(outputArea).toContainText('Product copyWith');

    // 2. Switch to json_serializable mode
    const constructSelect = page.locator('#construct-style');
    await constructSelect.selectOption('json_serializable');

    await expect(outputArea).toContainText("@JsonSerializable()");
    await expect(outputArea).toContainText("part 'product.g.dart';");
    await expect(outputArea).toContainText("factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);");

    // 3. Switch to freezed mode
    await constructSelect.selectOption('freezed');

    await expect(outputArea).toContainText("@freezed");
    await expect(outputArea).toContainText("part 'product.freezed.dart';");
    await expect(outputArea).toContainText("const factory Product({");
    await expect(outputArea).toContainText("}) = _Product;");

    // 4. Test presets
    const userAuthPresetBtn = page.locator('button:has-text("User Management & Auth")');
    await userAuthPresetBtn.click();

    await expect(inputArea).toContainText('enum Role');
    await expect(outputArea).toContainText('enum Role');
    await expect(outputArea).toContainText('class User');

    // 5. Clear action
    const clearBtn = page.locator('button:has-text("Clear")');
    await clearBtn.click();

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
