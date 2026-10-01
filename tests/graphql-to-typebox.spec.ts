import { test, expect } from '@playwright/test';

test.describe('GraphQL SDL to TypeBox Validation Schema Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/outil/graphql-to-typebox');
  });

  test('renders tool elements and converts sample GraphQL schema', async ({ page }) => {
    const inputArea = page.locator('#graphql-typebox-input');
    const outputArea = page.locator('#typebox-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    const sampleGql = `
      enum Role {
        ADMIN
        USER
      }

      type User {
        id: ID!
        username: String!
        email: String
        role: Role!
      }
    `;

    await inputArea.fill(sampleGql);

    await expect(outputArea).toHaveValue(/import \{ Type, Static \} from '@sinclair\/typebox';/);
    await expect(outputArea).toHaveValue(/export const RoleSchema = Type\.Union\(\[Type\.Literal\('ADMIN'\), Type\.Literal\('USER'\)\]\);/);
    await expect(outputArea).toHaveValue(/export const UserSchema = Type\.Object\(\{/);
    await expect(outputArea).toHaveValue(/id: Type\.String\(\),/);
    await expect(outputArea).toHaveValue(/username: Type\.String\(\),/);
    await expect(outputArea).toHaveValue(/email: Type\.Optional\(Type\.String\(\)\),/);
    await expect(outputArea).toHaveValue(/role: RoleSchema,/);
    await expect(outputArea).toHaveValue(/export type Role = Static<typeof RoleSchema>;/);
    await expect(outputArea).toHaveValue(/export type User = Static<typeof UserSchema>;/);
  });

  test('toggles options (UUID format, Readonly, Strict, Static Types)', async ({ page }) => {
    const inputArea = page.locator('#graphql-typebox-input');
    const outputArea = page.locator('#typebox-output');

    const sampleGql = `
      type Product {
        id: ID!
        title: String!
        price: Float
      }
    `;

    await inputArea.fill(sampleGql);

    // Toggle ID type to UUID
    await page.locator('#id-type').selectOption('uuid');
    await expect(outputArea).toHaveValue(/id: Type\.String\(\{ format: 'uuid' \}\),/);

    // Toggle Readonly Props
    await page.getByLabel(/Readonly Props/i).check();
    await expect(outputArea).toHaveValue(/title: Type\.Readonly\(Type\.String\(\)\),/);

    // Toggle Strict Objects
    await page.getByLabel(/Strict Objects/i).check();
    await expect(outputArea).toHaveValue(/export const ProductSchema = Type\.Strict\(Type\.Object\(\{/);

    // Toggle Static Types off
    await page.getByLabel(/Generate TS Types/i).uncheck();
    await expect(outputArea).not.toHaveValue(/type Product = Static<typeof ProductSchema>;/);
  });

  test('loads quick start presets', async ({ page }) => {
    const inputArea = page.locator('#graphql-typebox-input');
    const outputArea = page.locator('#typebox-output');

    // Click User Management & Auth preset
    await page.getByRole('button', { name: /User Management & Auth/i }).click();

    await expect(inputArea).toHaveValue(/enum Role/);
    await expect(outputArea).toHaveValue(/export const UserSchema = Type\.Object\(\{/);
    await expect(outputArea).toHaveValue(/export const AuthResultSchema = Type\.Union\(\[UserSchema, AuthErrorSchema\]\);/);
  });

  test('handles clear button and restores focus', async ({ page }) => {
    const inputArea = page.locator('#graphql-typebox-input');
    const outputArea = page.locator('#typebox-output');

    await inputArea.fill('type Item { id: ID! }');
    await expect(outputArea).toHaveValue(/ItemSchema/);

    await page.getByRole('button', { name: /Effacer/i }).click();

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('supports Escape shortcut to clear input', async ({ page }) => {
    const inputArea = page.locator('#graphql-typebox-input');
    await inputArea.fill('type Post { id: ID! }');

    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
  });

  test('enforces MAX_LENGTH limit and displays error banner', async ({ page }) => {
    const inputArea = page.locator('#graphql-typebox-input');

    // Fill with string exceeding MAX_LENGTH (100000 chars)
    const longString = 'a'.repeat(100001);
    await inputArea.fill(longString);

    await expect(page.locator('text=Input is too long')).toBeVisible();
  });
});
