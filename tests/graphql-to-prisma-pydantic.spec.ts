import { test, expect } from '@playwright/test';

test.describe('GraphQL to Prisma & GraphQL to Pydantic Converters', () => {
  test('GraphQL to Prisma Schema converter works correctly', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/graphql-to-prisma');
    await expect(page.locator('h1')).toContainText('GraphQL en Prisma');

    const inputArea = page.locator('#graphql-prisma-input');
    const outputArea = page.locator('#prisma-output');

    await inputArea.fill(`enum Role {
  USER
  ADMIN
}

type User {
  id: ID!
  email: String!
  role: Role!
}`);

    await expect(outputArea).toHaveValue(/model User/);
    await expect(outputArea).toHaveValue(/enum Role/);
    await expect(outputArea).toHaveValue(/email\s+String/);

    // Test preset click
    const presetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toHaveValue(/model Product/);
  });

  test('GraphQL to Pydantic converter works correctly', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/graphql-to-pydantic');
    await expect(page.locator('h1')).toContainText('GraphQL en Pydantic');

    const inputArea = page.locator('#graphql-pydantic-input');
    const outputArea = page.locator('#pydantic-output');

    await inputArea.fill(`enum UserRole {
  USER
  ADMIN
}

type User {
  id: ID!
  emailAddress: String!
  userRole: UserRole!
}`);

    await expect(outputArea).toHaveValue(/class UserRole\(str, Enum\):/);
    await expect(outputArea).toHaveValue(/class User\(BaseModel\):/);
    await expect(outputArea).toHaveValue(/email_address:\s*str/);

    // Test preset click
    const presetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toHaveValue(/class Product\(BaseModel\):/);
  });

  test('JSON to Prisma upgraded component works correctly', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/json-to-prisma');
    await expect(page.locator('h1')).toContainText('JSON en Prisma');

    const outputArea = page.locator('#prisma-output');

    // Test preset click
    const presetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(outputArea).toHaveValue(/model Category/);
  });
});
