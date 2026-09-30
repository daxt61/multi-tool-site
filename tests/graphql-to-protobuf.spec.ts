import { test, expect } from '@playwright/test';

test.describe('GraphQL to Protobuf Generator', () => {
  test('GraphQL to Protobuf: Converts SDL schema to .proto definitions and handles options & presets', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-protobuf');
    await page.waitForLoadState('networkidle');

    // 1. Verify Title & Inputs
    await expect(page.locator('h1')).toContainText('GraphQL en Protobuf');
    const inputArea = page.locator('#graphql-proto-input');
    const outputArea = page.locator('#proto-output');
    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // 2. Load Preset: E-Commerce Catalog
    const ecommercePresetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await ecommercePresetBtn.click();

    // Verify converted Protobuf schema
    await expect(outputArea).toHaveValue(/syntax = "proto3";/);
    await expect(outputArea).toHaveValue(/package model;/);
    await expect(outputArea).toHaveValue(/message Product \{/);
    await expect(outputArea).toHaveValue(/enum OrderStatus \{/);
    await expect(outputArea).toHaveValue(/ORDER_STATUS_UNSPECIFIED = 0;/);
    await expect(outputArea).toHaveValue(/repeated string tags = \d+;/);

    // 3. Change Package Name
    const packageNameInput = page.locator('#package-name-input');
    await packageNameInput.fill('ecommerce.v1');
    await expect(outputArea).toHaveValue(/package ecommerce.v1;/);

    // 4. Change Field Casing Mode
    const casingSelect = page.locator('#casing-mode-select');
    await casingSelect.selectOption('camelCase');
    await expect(outputArea).toHaveValue(/bool isActive = \d+;/);

    // 5. Test Copy Button & Toast
    const copyBtn = page.getByRole('button', { name: /Copier/i }).last();
    await copyBtn.click();
    await expect(page.locator('ol[tabindex="-1"]')).toContainText('Définitions Protobuf .proto copiées dans le presse-papiers !');

    // 6. Test Keyboard Shortcut: Esc clears and restores focus
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });

  test('GraphQL to Protobuf: Handles interfaces, inputs, unions, and proto2 syntax', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-protobuf');
    await page.waitForLoadState('networkidle');

    // Load User Auth preset
    const userAuthBtn = page.getByRole('button', { name: 'Gestion Utilisateurs & Auth' });
    await userAuthBtn.click();

    const outputArea = page.locator('#proto-output');
    await expect(outputArea).toHaveValue(/message User \{/);
    await expect(outputArea).toHaveValue(/message RegisterUserInput \{/);
    await expect(outputArea).toHaveValue(/message AuthResult \{/);
    await expect(outputArea).toHaveValue(/oneof value \{/);

    // Change Syntax to proto2
    const syntaxSelect = page.locator('#syntax-version-select');
    await syntaxSelect.selectOption('proto2');
    await expect(outputArea).toHaveValue(/syntax = "proto2";/);
    await expect(outputArea).toHaveValue(/optional string email = \d+;/);
  });
});
