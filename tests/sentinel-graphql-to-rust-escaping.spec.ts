import { test, expect } from '@playwright/test';

test.describe('GraphQL to Rust Escaping Security Tests', () => {
  test('escapes quotes, backslashes, and control characters in Serde rename attributes', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-rust');
    await page.waitForSelector('#graphql-rust-input');

    // Input GraphQL SDL containing quotes, backslashes, and newlines in field name and enum value
    const maliciousSdl = `
type SecurityTest {
  fieldWith"Quotes"And\\Backslash: String!
}

enum DangerousEnum {
  VAL"WITH"QUOTES
}
`;

    await page.fill('#graphql-rust-input', maliciousSdl);

    // Get output text
    const outputArea = page.locator('#rust-output');
    await expect(outputArea).not.toHaveValue('');
    const outputText = await outputArea.inputValue();

    // Verify #[serde(rename = "...")] escaped quotes and backslashes
    expect(outputText).toContain('#[serde(rename = "fieldWith\\"Quotes\\"And\\\\Backslash")]');
    expect(outputText).toContain('#[serde(rename = "VAL\\"WITH\\"QUOTES")]');
  });
});
