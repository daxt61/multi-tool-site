import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL string literal escaping security tests', () => {
  test('should escape single quotes and backslashes in GraphQLToKysely enum values', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/graphql-to-kysely');

    const inputArea = page.locator('#graphql-kysely-input');
    await expect(inputArea).toBeVisible();

    const maliciousGql = `
enum UserStatus {
  ACTIVE
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

    const outputArea = page.locator('#kysely-output');
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();

    expect(outputText).toContain("export type UserStatus = 'ACTIVE' | 'O\\'CONNOR' | 'QUOTE\\'OR\\'1\\'=\\'1' | 'BACK\\\\SLASH';");
  });

  test('should escape single quotes and backslashes in GraphQLToTypeScript enum values', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/graphql-to-typescript');

    const inputArea = page.locator('#graphql-input');
    await expect(inputArea).toBeVisible();

    const maliciousGql = `
enum UserStatus {
  ACTIVE
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

    const outputArea = page.locator('#ts-output');
    await expect(outputArea).toBeVisible();

    const outputText = await outputArea.inputValue();

    expect(outputText).toContain("O'CONNOR = 'O\\'CONNOR',");
    expect(outputText).toContain("BACK\\SLASH = 'BACK\\\\SLASH',");
  });
});
