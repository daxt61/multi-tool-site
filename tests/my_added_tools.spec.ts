import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('New JSON Conversion Tools', () => {
  test('JSON to Swift works', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/json-to-swift`);
    await page.fill('#json-input', '{"id": 1, "name": "Test", "active": true}');

    const output = page.locator('#swift-output');
    await expect(output).toHaveValue(/struct RootObject: Codable/);
    await expect(output).toHaveValue(/let id: Int/);
    await expect(output).toHaveValue(/let name: String/);
    await expect(output).toHaveValue(/let active: Bool/);
  });

  test('JSON to Ruby works', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/json-to-ruby`);
    await page.fill('#json-input', '{"id": 1, "name": "Test"}');

    const output = page.locator('#ruby-output');
    await expect(output).toHaveValue(/class RootObject/);
    await expect(output).toHaveValue(/attr_accessor :id, :name/);
  });

  test('JSON to Scala works', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/json-to-scala`);
    await page.fill('#json-input', '{"id": 1, "name": "Test"}');

    const output = page.locator('#scala-output');
    await expect(output).toHaveValue(/case class RootObject\(/);
    await expect(output).toHaveValue(/id: Int/);
    await expect(output).toHaveValue(/name: String/);
  });
});
