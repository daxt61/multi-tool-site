import { test, expect } from '@playwright/test';

test.describe('New JSON Conversion Tools', () => {
  test('JSON to Java POJO works', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-java');
    await expect(page.getByRole('heading', { name: 'JSON en Java', exact: true })).toBeVisible();

    const input = '{"id": 1, "name": "Test"}';
    await page.fill('#json-input', input);

    const output = page.locator('#java-output');
    await expect(output).toHaveValue(/public class RootObject/);
    await expect(output).toHaveValue(/private Integer id;/);
    await expect(output).toHaveValue(/private String name;/);
  });

  test('JSON to C# Class works', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-csharp');
    await expect(page.getByRole('heading', { name: 'JSON en C#', exact: true })).toBeVisible();

    const input = '{"id": 1, "name": "Test"}';
    await page.fill('#json-input', input);

    const output = page.locator('#cs-output');
    await expect(output).toHaveValue(/public class RootObject/);
    await expect(output).toHaveValue(/\[JsonPropertyName\("id"\)\]/);
    await expect(output).toHaveValue(/public int Id { get; set; }/);
  });

  test('Upgraded JSON to TS works', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-ts');
    await expect(page.getByRole('heading', { name: 'JSON en TS' })).toBeVisible();

    const input = '{"id": 1, "address": {"city": "Paris"}}';
    await page.fill('#json-input', input);

    const output = await page.locator('#ts-output').inputValue();
    expect(output).toContain('interface Address {');
    expect(output).toContain('interface RootObject {');

    // Test optional toggle
    await page.click('button:has-text("Optionnel")');
    const optionalOutput = await page.locator('#ts-output').inputValue();
    expect(optionalOutput).toContain('id?: number;');

    // Test ReadOnly toggle
    await page.click('button:has-text("ReadOnly")');
    const readonlyOutput = await page.locator('#ts-output').inputValue();
    expect(readonlyOutput).toContain('readonly id?: number;');
  });
});
