import { test, expect } from '@playwright/test';

test.describe('XML to JSON Schema E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/xml-to-json-schema');
  });

  test('converts XML to JSON Schema correctly', async ({ page }) => {
    const xmlInput = page.locator('#xml-input');
    const jsonSchemaOutput = page.locator('#json-schema-output');

    await xmlInput.fill('<user id="10"><name>Alice</name><active>true</active></user>');

    await expect(jsonSchemaOutput).toContainText('"title": "user Schema"');
    await expect(jsonSchemaOutput).toContainText('"@id"');
    await expect(jsonSchemaOutput).toContainText('"name"');
    await expect(jsonSchemaOutput).toContainText('"active"');
  });

  test('applies XML quick presets', async ({ page }) => {
    const xmlInput = page.locator('#xml-input');
    const jsonSchemaOutput = page.locator('#json-schema-output');

    await page.getByRole('button', { name: 'Product Catalog XML' }).click();

    await expect(xmlInput).toHaveValue(/catalog department="Electronics"/);
    await expect(jsonSchemaOutput).toContainText('"title": "catalog Schema"');
    await expect(jsonSchemaOutput).toContainText('"product"');
  });

  test('toggles required fields mode and options', async ({ page }) => {
    const xmlInput = page.locator('#xml-input');
    const jsonSchemaOutput = page.locator('#json-schema-output');

    await xmlInput.fill('<item><title>Test</title></item>');
    await expect(jsonSchemaOutput).toContainText('"required"');

    await page.locator('#required-mode-optional').click();
    await expect(jsonSchemaOutput).not.toContainText('"required"');
  });
});
