import { test, expect } from '@playwright/test';

test.describe('GraphQL to TypeScript & JSON to GraphQL Converters', () => {
  test('GraphQL to TypeScript: Converts SDL schema to TypeScript interfaces and handles presets and options', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-typescript');
    await page.waitForLoadState('networkidle');

    // 1. Verify Title & Input Elements
    await expect(page.locator('h1')).toContainText('GraphQL en TypeScript');
    const inputArea = page.locator('#graphql-input');
    const outputArea = page.locator('#ts-output');
    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // 2. Load Preset: E-Commerce Catalog
    const ecommercePresetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommercePresetBtn.click();

    // Verify output contains converted TypeScript definitions
    await expect(outputArea).toHaveValue(/export interface Category/);
    await expect(outputArea).toHaveValue(/export interface Product/);
    await expect(outputArea).toHaveValue(/export enum OrderStatus/);
    await expect(outputArea).toHaveValue(/id: string;/);
    await expect(outputArea).toHaveValue(/tags: \(string\)\[\];/);

    // 3. Test Options: Change Enum Style to Union
    const enumStyleSelect = page.locator('#enum-style');
    await enumStyleSelect.selectOption('union');
    await expect(outputArea).toHaveValue(/export type OrderStatus = 'PENDING' \| 'PROCESSING' \| 'SHIPPED' \| 'DELIVERED' \| 'CANCELLED';/);

    // 4. Test ID Scalar Option: Change ID to string | number
    const idTypeSelect = page.locator('#id-type');
    await idTypeSelect.selectOption('string_number');
    await expect(outputArea).toHaveValue(/id: string \| number;/);

    // 5. Test Copy Button & Sonner Toast
    const copyBtn = page.getByRole('button', { name: /Copier/i }).last();
    await copyBtn.click();
    await expect(page.locator('ol[tabindex="-1"]')).toContainText('Définitions TypeScript copiées dans le presse-papiers !');

    // 6. Test Keyboard Shortcut: Esc clears input and focuses inputArea
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('GraphQL to TypeScript: Handles interfaces, inputs, unions, and custom scalars', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-typescript');
    await page.waitForLoadState('networkidle');

    // Load User Auth preset
    const userAuthBtn = page.getByRole('button', { name: 'Gestion Utilisateurs & Auth' });
    await userAuthBtn.click();

    const outputArea = page.locator('#ts-output');
    await expect(outputArea).toHaveValue(/export interface User/);
    await expect(outputArea).toHaveValue(/export interface Node/);
    await expect(outputArea).toHaveValue(/export interface RegisterUserInput/);
    await expect(outputArea).toHaveValue(/export type AuthResult = User \| AuthError;/);
  });

  test('JSON to GraphQL: Converts JSON to GraphQL schema and handles presets and shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-graphql');
    await page.waitForLoadState('networkidle');

    // 1. Verify Title & Inputs
    await expect(page.locator('h1')).toContainText('JSON en GraphQL');
    const inputArea = page.locator('#json-input');
    const outputArea = page.locator('#graphql-output');

    // 2. Load Preset: E-Commerce Order JSON
    const presetBtn = page.getByRole('button', { name: 'Commande E-Commerce JSON' });
    await presetBtn.click();

    // Verify GraphQL schema output
    await expect(outputArea).toHaveValue(/type RootObject \{/);
    await expect(outputArea).toHaveValue(/orderId: String/);
    await expect(outputArea).toHaveValue(/totalAmount: Float/);
    await expect(outputArea).toHaveValue(/isPaid: Boolean/);
    await expect(outputArea).toHaveValue(/items: \[Items\]/);

    // 3. Test Copy Button
    const copyBtn = page.getByRole('button', { name: /Copier/i }).last();
    await copyBtn.click();
    await expect(page.locator('ol[tabindex="-1"]')).toContainText('Schéma GraphQL copié dans le presse-papiers !');

    // 4. Test Keyboard Shortcut: Esc clears and focuses input
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
