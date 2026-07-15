import { test, expect } from '@playwright/test';

test.describe('New Tool and Upgrades Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr');
  });

  test('JSON to OpenAPI tool is accessible and functional', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-openapi');
    await expect(page.locator('h1')).toContainText('JSON en OpenAPI');

    const input = page.locator('#json-input');
    await input.fill('{"id": 1, "name": "Test API"}');

    const output = page.locator('#openapi-output');
    await expect(output).toContainText('openapi: 3.0.0');
    await expect(output).toContainText('title: Generated API');
    await expect(output).toContainText('type: integer');
  });

  test('ASCII Art Generator upgrade: custom character', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/ascii-art');
    const input = page.locator('#ascii-input');
    await input.fill('A');

    const customCharInput = page.locator('#custom-char');
    await customCharInput.fill('#');

    const output = page.locator('pre');
    await expect(output).toContainText('#');
  });

  test('JSON to C# upgrade: records and init-only', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-csharp');
    const input = page.locator('#json-input');
    await input.fill('{"name": "John"}');

    // Check for Records toggle
    const recordBtn = page.getByRole('button', { name: 'Records' });
    await recordBtn.click();

    const output = page.locator('#cs-output');
    await expect(output).toContainText('public record RootObject');

    // Check for Init-only toggle
    const initOnlyBtn = page.getByRole('button', { name: 'Init-only' });
    await initOnlyBtn.click();
    await expect(output).toContainText('get; init;');
  });
});
