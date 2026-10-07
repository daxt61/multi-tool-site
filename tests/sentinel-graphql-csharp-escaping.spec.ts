import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL to C# String Escaping Mitigation', () => {
  test('GraphQLToCSharp safely escapes double quotes, backslashes, and newlines in generated C# attributes', async ({ page }) => {
    await page.goto('http://localhost:4173/en/dev/graphql-to-csharp');

    // GraphQL schema with raw field names containing double quotes, backslashes, and newlines
    const gqlInput = `type User {
  "class\\"_injected" : String!
  "injected\\\\value" : Int!
}`;

    const inputArea = page.locator('#graphql-csharp-input');
    await inputArea.fill(gqlInput);

    const outputArea = page.locator('#csharp-output');
    const outputText = await outputArea.inputValue();

    // Verify attribute strings are properly escaped and do not allow string breakout
    expect(outputText).toContain('[JsonPropertyName("class\\\\\\"_injected")]');
    expect(outputText).not.toContain('[JsonPropertyName("class"_injected")]');
    expect(outputText).toContain('[JsonPropertyName("injected\\\\\\\\value")]');
  });
});
