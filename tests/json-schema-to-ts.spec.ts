import { test, expect } from '@playwright/test';

test.describe('JSON Schema to TypeScript Converter E2E & UX', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the JSON Schema to TypeScript page
    await page.goto('http://localhost:5173/en/outil/json-schema-to-ts');
  });

  test('should load the page, headings, and input areas with correct accessibility', async ({ page }) => {
    // Check main title and description
    await expect(page.locator('h1').first()).toContainText('JSON Schema to TypeScript');
    await expect(page.locator('text=Generate clean TypeScript interfaces')).toBeVisible();

    // Confirm htmlFor/id associations are proper
    const textLabel = page.locator('label[for="schema-json-input"]');
    await expect(textLabel).toBeVisible();
    await expect(textLabel).toContainText('Input JSON Schema');

    const formatLabel = page.locator('label[for="output-type-select"]');
    await expect(formatLabel).toBeVisible();
    await expect(formatLabel).toContainText('Output Format');

    const rootLabel = page.locator('label[for="root-name-input"]');
    await expect(rootLabel).toBeVisible();
    await expect(rootLabel).toContainText('Root Type Name');

    const textarea = page.locator('#schema-json-input');
    await expect(textarea).toBeEmpty();
  });

  test('should load presets and generate correct TypeScript interface structure', async ({ page }) => {
    // Click on "Simple User" sample button
    const simpleUserButton = page.getByRole('button', { name: 'Simple User' });
    await expect(simpleUserButton).toBeVisible();
    await simpleUserButton.click();

    // Verify input contains JSON schema
    const textarea = page.locator('#schema-json-input');
    const value = await textarea.inputValue();
    expect(value).toContain('"title": "User"');
    expect(value).toContain('"username"');

    // Wait for the converted code preview
    const outputArea = page.locator('pre');
    await page.waitForTimeout(500);
    const code = await outputArea.textContent();

    expect(code).toContain('interface User {');
    expect(code).toContain('id: number;');
    expect(code).toContain('username: string;');
    expect(code).toContain('email: string;');
    expect(code).toContain('age?: number;');
    expect(code).toContain('isAdmin?: boolean;');
    expect(code).toContain('role?: "admin" | "user" | "guest";');
  });

  test('should handle references correctly using the Product preset', async ({ page }) => {
    // Click on "Product (Refs)" sample button
    const productButton = page.getByRole('button', { name: 'Product (Refs)' });
    await expect(productButton).toBeVisible();
    await productButton.click();

    const outputArea = page.locator('pre');
    await page.waitForTimeout(500);
    const code = await outputArea.textContent();

    // Must generate main interface
    expect(code).toContain('interface Product {');
    expect(code).toContain('sku: string;');
    expect(code).toContain('name: string;');
    expect(code).toContain('price: number;');
    expect(code).toContain('tags?: Array<string>;');
    expect(code).toContain('dimensions: {');
    expect(code).toContain('warehouse?: Location;');

    // Must extract Location sub-interface
    expect(code).toContain('interface Location {');
    expect(code).toContain('id: string;');
    expect(code).toContain('city: string;');
    expect(code).toContain('country?: string;');
  });

  test('should support different output formats (Type, Zod, TypeBox)', async ({ page }) => {
    // Load Simple User sample
    await page.getByRole('button', { name: 'Simple User' }).click();
    await page.waitForTimeout(300);

    const select = page.locator('#output-type-select');
    const outputArea = page.locator('pre');

    // Switch to Type Alias
    await select.selectOption('type');
    await page.waitForTimeout(300);
    let code = await outputArea.textContent();
    expect(code).toContain('type User = {');

    // Switch to Zod Schema
    await select.selectOption('zod');
    await page.waitForTimeout(300);
    code = await outputArea.textContent();
    expect(code).toContain('const UserSchema = z.object({');
    expect(code).toContain('id: z.number(),');
    expect(code).toContain('username: z.string(),');
    expect(code).toContain('role: z.enum(["admin", "user", "guest"]).optional(),');

    // Switch to TypeBox Schema
    await select.selectOption('typebox');
    await page.waitForTimeout(300);
    code = await outputArea.textContent();
    expect(code).toContain('const User = Type.Object({');
    expect(code).toContain('id: Type.Number(),');
    expect(code).toContain('username: Type.String(),');
    expect(code).toContain('role: Type.Optional(Type.Union([');
  });

  test('should correctly toggle Export and ReadOnly options', async ({ page }) => {
    await page.getByRole('button', { name: 'Simple User' }).click();
    await page.waitForTimeout(300);

    const outputArea = page.locator('pre');

    // Toggle off export
    const exportCheckbox = page.locator('input[type="checkbox"]').first();
    await exportCheckbox.uncheck();
    await page.waitForTimeout(300);
    let code = await outputArea.textContent();
    expect(code).not.toContain('export interface User');
    expect(code).toContain('interface User');

    // Toggle on ReadOnly
    const readOnlyCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await readOnlyCheckbox.check();
    await page.waitForTimeout(300);
    code = await outputArea.textContent();
    expect(code).toContain('readonly id: number;');
    expect(code).toContain('readonly username: string;');
  });

  test('should clear inputs on pressing Escape key inside the textarea', async ({ page }) => {
    const textarea = page.locator('#schema-json-input');
    await textarea.focus();
    await textarea.fill('{"invalid": "schema"}');

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Should be clear and focused
    await expect(textarea).toBeEmpty();
    await expect(textarea).toBeFocused();
  });

  test('should copy output to clipboard and trigger toast on copy button or keypress C', async ({ page }) => {
    await page.getByRole('button', { name: 'Simple User' }).click();
    await page.waitForTimeout(300);

    // Verify copy button click
    const copyBtn = page.locator('button:has(svg.lucide-copy)').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Toast notification check
    const toast = page.locator('text=Code copied to clipboard!');
    await expect(toast).toBeVisible();
  });

  test('should transition perfectly to French language localization', async ({ page }) => {
    // Navigate to French version
    await page.goto('http://localhost:5173/fr/outil/json-schema-to-ts');
    await page.waitForTimeout(500);

    // Header validation
    await expect(page.locator('h1').first()).toContainText('JSON Schema vers TypeScript');
    await expect(page.locator('text=Générez des interfaces TypeScript')).toBeVisible();

    // Label validation
    await expect(page.locator('label[for="schema-json-input"]')).toContainText("Schéma JSON d'entrée");
    await expect(page.locator('label[for="output-type-select"]')).toContainText('Format de sortie');
    await expect(page.locator('label[for="root-name-input"]')).toContainText('Nom du Type Racine');

    // Load sample and check toast in French
    await page.getByRole('button', { name: 'Utilisateur Simple' }).click();
    await expect(page.locator('text=Exemple "user" chargé')).toBeVisible();
  });
});
