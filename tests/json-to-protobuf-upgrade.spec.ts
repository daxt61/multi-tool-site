import { test, expect } from '@playwright/test';

test.describe('JSON to Protobuf Upgrade E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-protobuf');
  });

  test('converts JSON to proto3 schema correctly', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const protoOutput = page.locator('#proto-output');

    await jsonInput.fill('{"user_id": 42, "user_name": "Jules", "roles": ["admin"]}');

    await expect(protoOutput).toHaveValue(/syntax = "proto3";/);
    await expect(protoOutput).toHaveValue(/package model;/);
    await expect(protoOutput).toHaveValue(/message RootObject/);
    await expect(protoOutput).toHaveValue(/int32 user_id = 1;/);
    await expect(protoOutput).toHaveValue(/string user_name = 2;/);
    await expect(protoOutput).toHaveValue(/repeated string roles = 3;/);
  });

  test('applies presets correctly', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const protoOutput = page.locator('#proto-output');

    await page.getByRole('button', { name: 'User Profile & Roles' }).click();

    await expect(jsonInput).toHaveValue(/alex_developer/);
    await expect(protoOutput).toHaveValue(/message Profile/);
    await expect(protoOutput).toHaveValue(/message RootObject/);
  });

  test('updates options for package name and casing', async ({ page }) => {
    const packageNameInput = page.locator('#package-name-input');
    const casingSelect = page.locator('#casing-mode-select');
    const protoOutput = page.locator('#proto-output');

    await page.locator('#json-input').fill('{"firstName": "Jane", "lastName": "Doe"}');

    await packageNameInput.fill('custom_pkg');
    await expect(protoOutput).toHaveValue(/package custom_pkg;/);

    await casingSelect.selectOption('snake_case');
    await expect(protoOutput).toHaveValue(/first_name/);
    await expect(protoOutput).toHaveValue(/last_name/);
  });
});
