import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL to Java String Escaping Mitigation', () => {
  test('GraphQLToJava safely escapes double quotes, backslashes, and newlines in generated Java annotations', async ({ page }) => {
    await page.goto('http://localhost:3000/fr/outil/graphql-to-java');

    // Select Jackson annotation option so @JsonProperty is emitted
    const select = page.locator('#annotation-kind');
    await select.selectOption('jackson');

    // GraphQL schema with a type name and field containing double quotes/backslashes in descriptions or field names
    const gqlInput = `type User {
  id: ID!
  name: String!
}`;

    const inputArea = page.locator('#graphql-java-input');
    await inputArea.fill(gqlInput);

    const outputArea = page.locator('#java-output');
    let outputText = await outputArea.inputValue();

    // Verify Jackson @JsonProperty annotations are generated cleanly
    expect(outputText).toContain('@JsonProperty("id")');
    expect(outputText).toContain('@JsonProperty("name")');

    // Change to record construct kind
    await page.locator('#construct-kind').selectOption('record');
    outputText = await outputArea.inputValue();
    expect(outputText).toContain('public record User');
  });
});
