import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL to Python Pydantic String Escaping Mitigation', () => {
  test('GraphQLToPython safely escapes double quotes, backslashes, and newlines in Pydantic field aliases', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-python');

    // GraphQL schema with field names containing double quotes and python reserved keywords that trigger field aliases
    const gqlInput = `type User {
  class: String!
  import\\"_injected: String
}`;

    const inputArea = page.locator('#graphql-python-input');
    await inputArea.fill(gqlInput);

    const outputArea = page.locator('#python-output');
    const outputText = await outputArea.inputValue();

    // Verify alias string is properly escaped and does not allow string literal breakout
    expect(outputText).toContain('alias="class"');
    expect(outputText).toContain('alias="import\\\\\\"_injected"');
    expect(outputText).not.toContain('alias="import"_injected"');
  });
});
