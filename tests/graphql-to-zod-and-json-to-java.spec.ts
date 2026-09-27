import { test, expect } from '@playwright/test';

test.describe('GraphQL to Zod & JSON to Java Palette UX', () => {
  test('GraphQLToZod converts GraphQL SDL to Zod validation schemas', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-zod');
    await expect(page.locator('h1')).toContainText('GraphQL to Zod');

    const inputArea = page.locator('#graphql-zod-input');
    const outputArea = page.locator('#zod-output');

    // Test default output or preset load
    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Click quick preset button
    const presetBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Check Toast
    await expect(page.locator('ol[data-sonner-toaster="true"]')).toContainText('Loaded GraphQL preset!');

    // Check converted output
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('import { z } from \'zod\';');
    expect(outputText).toContain('export const CategorySchema = z.object(');
    expect(outputText).toContain('export const ProductSchema = z.object(');
    expect(outputText).toContain('export const OrderStatusSchema = z.enum([');
    expect(outputText).toContain('export type Product = z.infer<typeof ProductSchema>;');

    // Test clear button and keyboard shortcut Esc
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // Type custom GraphQL schema
    await inputArea.fill(`type User {\n  id: ID!\n  email: String!\n  age: Int\n}`);
    await expect(outputArea).toContainText('export const UserSchema = z.object({');
    await expect(outputArea).toContainText('id: z.string(),');
    await expect(outputArea).toContainText('email: z.string(),');
    await expect(outputArea).toContainText('age: z.number().int().optional().nullable(),');

    // Click copy button explicitly
    const copyBtn = page.getByRole('button', { name: /Copy/i }).last();
    await copyBtn.click();
    await expect(page.locator('ol[data-sonner-toaster="true"]')).toContainText('Zod validation schemas copied to clipboard!');
  });

  test('JSONToJava converts JSON to Java POJO and Java 17+ Records', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-java');
    await expect(page.locator('h1')).toContainText('JSON to Java');

    const inputArea = page.locator('#json-java-input');
    const outputArea = page.locator('#java-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Load User Profile Preset
    const userPresetBtn = page.getByRole('button', { name: 'User Profile' });
    await expect(userPresetBtn).toBeVisible();
    await userPresetBtn.click();

    await expect(page.locator('ol[data-sonner-toaster="true"]')).toContainText('Loaded JSON preset!');

    let outputText = await outputArea.inputValue();
    expect(outputText).toContain('package com.example.model;');
    expect(outputText).toContain('public class Profile {');
    expect(outputText).toContain('public class RootObject {');
    expect(outputText).toContain('private String userName;');

    // Switch to Java 17+ Record
    const constructSelect = page.locator('#construct-type');
    await constructSelect.selectOption('record');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('public record Profile(');
    expect(outputText).toContain('public record RootObject(');
    expect(outputText).toContain('String userName');

    // Change casing to snake_case
    const casingSelect = page.locator('#casing-type');
    await casingSelect.selectOption('snake_case');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('String user_name');

    // Test clear shortcut Esc
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();

    // Fill new custom JSON
    await inputArea.fill('{"book_id": 42, "title": "Clean Code"}');
    await expect(outputArea).toContainText('public record RootObject(');

    // Click copy button explicitly
    const copyBtn = page.getByRole('button', { name: /Copy/i }).last();
    await copyBtn.click();
    await expect(page.locator('ol[data-sonner-toaster="true"]')).toContainText('Java code copied to clipboard!');
  });
});
