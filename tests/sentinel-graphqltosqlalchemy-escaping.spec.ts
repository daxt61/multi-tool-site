import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL to SQLAlchemy Python String Escaping Security', () => {
  test('GraphQLToSQLAlchemy safely escapes double quotes, backslashes, and newlines in enum values', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-sqlalchemy');

    const gqlInput = `enum Status {
  ACTIVE
  INACTIVE\\"INJECTED
  MULTILINE\\nVAL
}

type User {
  id: ID!
  status: Status!
}`;

    const inputArea = page.locator('#graphql-sqlalchemy-input');
    await inputArea.fill(gqlInput);

    const outputArea = page.locator('#sqlalchemy-output');
    const outputText = await outputArea.inputValue();

    // Verify enum values are escaped and do not cause Python string literal breakout
    expect(outputText).toContain('INACTIVE__INJECTED = "INACTIVE\\\\\\"INJECTED"');
    expect(outputText).toContain('MULTILINE_nVAL = "MULTILINE\\\\nVAL"');
    expect(outputText).not.toContain('INACTIVE__INJECTED = "INACTIVE"INJECTED"');
  });
});
