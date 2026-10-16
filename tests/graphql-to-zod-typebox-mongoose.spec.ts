import { test, expect } from '@playwright/test';

test.describe('GraphQL to Zod, TypeBox, and Mongoose Converters', () => {
  test('GraphQLToZod converts schema, escapes enum strings, and supports presets', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-zod');

    // Verify UI components
    await expect(page.locator('#graphql-zod-input')).toBeVisible();

    // Click preset button
    await page.click('button:has-text("E-Commerce Catalog")');
    await expect(page.locator('button:has-text("E-Commerce Catalog")')).toHaveAttribute('aria-pressed', 'true');

    // Verify output generated
    const output = await page.locator('#zod-output').inputValue();
    expect(output).toContain("import { z } from 'zod';");
    expect(output).toContain('const OrderStatusSchema = z.enum([');
    expect(output).toContain('PENDING');
    expect(output).toContain('const ProductSchema = z.object({');

    // Test enum string escaping
    const schemaWithQuotes = `
enum Status {
  CAN'T_CANCEL
  HAS\\BACKSLASH
}
`;
    await page.fill('#graphql-zod-input', schemaWithQuotes);
    const escapedOutput = await page.locator('#zod-output').inputValue();
    expect(escapedOutput).toContain("'CAN\\'T_CANCEL'");
    expect(escapedOutput).toContain("'HAS\\\\BACKSLASH'");

    // Test clear button and focus restoration
    await page.click('button:has-text("Clear")');
    await expect(page.locator('#graphql-zod-input')).toHaveValue('');
    await expect(page.locator('#graphql-zod-input')).toBeFocused();
  });

  test('GraphQLToTypeBox converts schema, escapes literal strings, and supports presets', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-typebox');

    // Verify UI components
    await expect(page.locator('#graphql-typebox-input')).toBeVisible();

    // Click preset button
    await page.click('button:has-text("User Management & Auth")');
    await expect(page.locator('button:has-text("User Management & Auth")')).toHaveAttribute('aria-pressed', 'true');

    // Verify output generated
    const output = await page.locator('#typebox-output').inputValue();
    expect(output).toContain("import { Type, Static } from '@sinclair/typebox';");
    expect(output).toContain('const RoleSchema = Type.Union([');
    expect(output).toContain("Type.Literal('ADMIN')");

    // Test string escaping in TypeBox literals
    const schemaWithQuotes = `
enum Mode {
  DON'T_DISTURB
}
`;
    await page.fill('#graphql-typebox-input', schemaWithQuotes);
    const escapedOutput = await page.locator('#typebox-output').inputValue();
    expect(escapedOutput).toContain("Type.Literal('DON\\'T_DISTURB')");

    // Test clear button and focus
    await page.click('button:has-text("Clear")');
    await expect(page.locator('#graphql-typebox-input')).toHaveValue('');
    await expect(page.locator('#graphql-typebox-input')).toBeFocused();
  });

  test('GraphQLToMongoose converts schema to Mongoose Schemas & TS Interfaces', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-mongoose');

    // Verify UI components
    await expect(page.locator('#graphql-mongoose-input')).toBeVisible();

    // Click preset
    await page.click('button:has-text("Social Feed & Comments")');
    await expect(page.locator('button:has-text("Social Feed & Comments")')).toHaveAttribute('aria-pressed', 'true');

    // Verify output generated
    const output = await page.locator('#mongoose-output').inputValue();
    expect(output).toContain("import { Schema, model, Document } from 'mongoose';");
    expect(output).toContain('export interface IUser extends Document {');
    expect(output).toContain('export interface IComment extends Document {');
    expect(output).toContain('export interface IPost extends Document {');
    expect(output).toContain('export const CommentSchema = new Schema<IComment>({');
    expect(output).toContain('export const Post = model<IPost>(\'Post\', PostSchema);');

    // Test clear button and focus
    await page.click('button:has-text("Clear")');
    await expect(page.locator('#graphql-mongoose-input')).toHaveValue('');
    await expect(page.locator('#graphql-mongoose-input')).toBeFocused();
  });
});
