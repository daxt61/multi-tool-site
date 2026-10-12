import { test, expect } from '@playwright/test';

test.describe('GraphQL and SQL to Yup and Joi Converters E2E Tests', () => {

  test('GraphQLToYup converts SDL schema, toggles options, loads presets, and handles hotkeys', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-yup');

    await expect(page.locator('h1')).toContainText('GraphQL en Yup');
    const input = page.locator('#graphql-yup-input');
    const output = page.locator('#yup-output');

    // Load E-Commerce preset
    const ecommerceBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(input).toHaveValue(/type Category/);
    await expect(output).toHaveValue(/export const CategoryYupSchema = yup.object/);
    await expect(output).toHaveValue(/export type CategorySchemaType = yup.InferType/);

    // Load User Auth preset
    const userAuthBtn = page.getByRole('button', { name: 'Gestion Utilisateurs & Auth' });
    await userAuthBtn.click();
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(input).toHaveValue(/enum Role/);
    await expect(output).toHaveValue(/export const RoleYupSchema = yup.string\(\).oneOf/);

    // Toggle property casing
    const casingSelect = page.locator('#property-casing');
    await casingSelect.selectOption('snake_case');
    await expect(output).toHaveValue(/full_name/);

    // Copy hotkey
    await input.blur();
    await page.keyboard.press('c');
    await expect(page.locator('ol')).toContainText('Yup schema copied to clipboard');

    // Escape clear hotkey
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('GraphQLToJoi converts SDL schema, loads presets, and handles hotkeys', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-joi');

    await expect(page.locator('h1')).toContainText('GraphQL en Joi');
    const input = page.locator('#graphql-joi-input');
    const output = page.locator('#joi-output');

    // Load E-Commerce preset
    const ecommerceBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(input).toHaveValue(/type Category/);
    await expect(output).toHaveValue(/const Joi = require\('joi'\)/);
    await expect(output).toHaveValue(/const CategoryJoiSchema = Joi.object/);

    // Toggle property casing
    const casingSelect = page.locator('#property-casing');
    await casingSelect.selectOption('snake_case');
    await expect(output).toHaveValue(/is_active/);

    // Copy hotkey
    await input.blur();
    await page.keyboard.press('c');
    await expect(page.locator('ol')).toContainText('Joi schema copied to clipboard');

    // Escape clear hotkey
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('SQLToYup converts SQL DDL, loads presets, and handles hotkeys', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-yup');

    await expect(page.locator('h1')).toContainText('SQL DDL en Yup');
    const input = page.locator('#sql-yup-input');
    const output = page.locator('#yup-output');

    // Load E-Commerce preset
    const ecommerceBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(input).toHaveValue(/CREATE TABLE categories/);
    await expect(output).toHaveValue(/import \* as yup from 'yup'/);
    await expect(output).toHaveValue(/export const CategoriesYupSchema = yup.object/);

    // Copy hotkey
    await input.blur();
    await page.keyboard.press('c');
    await expect(page.locator('ol')).toContainText('Yup schema copied to clipboard');

    // Escape clear hotkey
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('SQLToJoi converts SQL DDL, loads presets, and handles hotkeys', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-joi');

    await expect(page.locator('h1')).toContainText('SQL DDL en Joi');
    const input = page.locator('#sql-joi-input');
    const output = page.locator('#joi-output');

    // Load E-Commerce preset
    const ecommerceBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(input).toHaveValue(/CREATE TABLE categories/);
    await expect(output).toHaveValue(/const Joi = require\('joi'\)/);
    await expect(output).toHaveValue(/const CategoriesJoiSchema = Joi.object/);

    // Copy hotkey
    await input.blur();
    await page.keyboard.press('c');
    await expect(page.locator('ol')).toContainText('Joi schema copied to clipboard');

    // Escape clear hotkey
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('GraphQLToCSharp has active preset tracking and aria-pressed attributes', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-csharp');

    await expect(page.locator('h1')).toContainText('GraphQL en C#');
    const input = page.locator('#graphql-csharp-input');
    const output = page.locator('#csharp-output');

    const ecommerceBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(input).toHaveValue(/type Category/);
    await expect(output).toHaveValue(/public record Category/);

    const userAuthBtn = page.getByRole('button', { name: 'Gestion Utilisateurs & Auth' });
    await userAuthBtn.click();
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
  });

});
