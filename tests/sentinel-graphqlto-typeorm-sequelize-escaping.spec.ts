import { test, expect } from '@playwright/test';

test.describe('Sentinel: GraphQL to TypeORM and Sequelize String Literal Escaping Security Tests', () => {
  test('should safely escape single quotes and backslashes in GraphQLToTypeORM', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-typeorm');
    await page.waitForSelector('#graphql-typeorm-input');

    const maliciousGql = `
enum UserRole {
  ADMIN'USER
  GUEST\\MEMBER
}

type UserAccount {
  id: ID!
  user's_email\\val: String!
}
`;

    await page.fill('#graphql-typeorm-input', maliciousGql);

    const outputArea = page.locator('#typeorm-output');
    await expect(outputArea).not.toHaveValue('');
    const output = await outputArea.inputValue();

    // Should contain escaped single quotes and backslashes in JS/TS string literals
    expect(output).toContain("AdminUser = 'ADMIN\\'USER'");
    expect(output).toContain("GuestMember = 'GUEST\\\\MEMBER'");
    expect(output).toContain("@Entity('user_accounts')");
    expect(output).toContain("name: 'user\\'s_email\\\\val'");

    // Ensure no unescaped single quotes break string literal context
    expect(output).not.toMatch(/name:\s*'user's_email/);
  });

  test('should safely escape single quotes and backslashes in GraphQLToSequelize', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-sequelize');
    await page.waitForSelector('#graphql-sequelize-input');

    const maliciousGql = `
enum OrderStatus {
  PENDING'ORDER
  SHIPPED\\CONFIRMED
}

type OrderItem {
  id: ID!
  item's_code\\ref: String!
}
`;

    await page.fill('#graphql-sequelize-input', maliciousGql);

    const outputArea = page.locator('#sequelize-output');
    await expect(outputArea).not.toHaveValue('');
    const output = await outputArea.inputValue();

    // Should contain escaped single quotes and backslashes in JS/TS string literals
    expect(output).toContain("PendingOrder = 'PENDING\\'ORDER'");
    expect(output).toContain("ShippedConfirmed = 'SHIPPED\\\\CONFIRMED'");
    expect(output).toContain("tableName: 'order_items'");
    expect(output).toContain("field: 'item\\'s_code\\\\ref'");

    // Ensure no unescaped single quotes break string literal context
    expect(output).not.toMatch(/field:\s*'item's_code/);
  });
});
