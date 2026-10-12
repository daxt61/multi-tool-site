import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL to Dart String Escaping Mitigation', () => {
  test('GraphQLToDart safely escapes single quotes, dollar signs, backslashes, and newlines in field names across all construct styles', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-dart');
    await expect(page.locator('h1')).toContainText('GraphQL to Dart');

    const inputArea = page.locator('#graphql-dart-input');
    const outputArea = page.locator('#dart-output');
    const constructSelect = page.locator('#construct-style');

    // 1. Test Plain Dart Class mode
    await inputArea.fill(`
      type User {
        bad'field: String!
        interp$val: Int!
        slash\\path: Boolean
      }
    `);

    // In plain mode: fromJson map access json['...'] and toJson map entry '...': ...
    await expect(outputArea).toContainText("json['bad\\'field']");
    await expect(outputArea).toContainText("json['interp\\$val']");
    await expect(outputArea).toContainText("json['slash\\\\path']");
    await expect(outputArea).toContainText("'bad\\'field':");
    await expect(outputArea).toContainText("'interp\\$val':");
    await expect(outputArea).toContainText("'slash\\\\path':");

    // 2. Test json_serializable mode
    await constructSelect.selectOption('json_serializable');
    await expect(outputArea).toContainText("@JsonKey(name: 'bad\\'field')");
    await expect(outputArea).toContainText("@JsonKey(name: 'interp\\$val')");
    await expect(outputArea).toContainText("@JsonKey(name: 'slash\\\\path')");

    // 3. Test freezed mode
    await constructSelect.selectOption('freezed');
    await expect(outputArea).toContainText("@JsonKey(name: 'bad\\'field')");
    await expect(outputArea).toContainText("@JsonKey(name: 'interp\\$val')");
    await expect(outputArea).toContainText("@JsonKey(name: 'slash\\\\path')");
  });
});
