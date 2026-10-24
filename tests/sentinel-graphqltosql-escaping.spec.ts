import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQLToSQL Enum Escaping Security Tests', () => {
  test('should properly escape single quotes and special characters in PostgreSQL enum values', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/graphql-to-sql');

    // Wait for the GraphQL input textarea to be visible
    const inputArea = page.locator('#graphql-sql-input');
    await expect(inputArea).toBeVisible();

    // Input GraphQL SDL schema containing enums with single quotes and backslashes
    const maliciousGql = `
enum UserStatus {
  ACTIVE
  INACTIVE
  O'CONNOR
  QUOTE'OR'1'='1
  BACK\\SLASH
}

type User {
  id: ID!
  status: UserStatus!
}
    `.trim();

    await inputArea.fill(maliciousGql);

    const outputArea = page.locator('#sql-output');
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();

    // Verify single quotes are escaped as '' and backslashes are escaped
    expect(outputText).toContain("CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'O''CONNOR', 'QUOTE''OR''1''=''1', 'BACK\\\\SLASH');");
  });
});
