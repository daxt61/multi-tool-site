import { test, expect } from '@playwright/test';

test.describe('Sentinel Security: GraphQLToPython Enum Escaping', () => {
  test('escapes double quotes and special characters in GraphQL enum values', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-python');

    const inputArea = page.locator('#graphql-python-input');
    await expect(inputArea).toBeVisible();

    const maliciousGql = `
enum MaliciousEnum {
  NORMAL
  WITH_QUOTE"INJECT
  MULTILINE\\nINJECT
}

type User {
  id: ID!
  status: MaliciousEnum!
}
`;

    await inputArea.fill(maliciousGql);

    const outputArea = page.locator('#python-output');
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();

    // Verify that double quotes and backslashes in enum values are safely escaped in Python double-quoted string literals
    expect(outputText).toContain('_WITH_QUOTE_INJECT = "WITH_QUOTE\\"INJECT"');
    expect(outputText).toContain('_MULTILINE_nINJECT = "MULTILINE\\\\nINJECT"');
  });
});
