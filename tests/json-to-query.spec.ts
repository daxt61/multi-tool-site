import { test, expect } from '@playwright/test';

test.describe('JSON to Query String Converter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main tool page
    await page.goto('http://localhost:5173/fr/outil/json-to-query');
  });

  test('should render headers and description', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText(/JSON en Query String/i);

    const description = page.locator('p');
    await expect(description.first()).toContainText(/Convertir bidirectionnellement du JSON/i);
  });

  test('should convert JSON to query string and respect array format', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const queryOutput = page.locator('#query-output');

    // Type valid JSON
    const sampleObj = { name: 'John Doe', age: 30, hobbies: ['coding', 'music'] };
    await jsonInput.fill(JSON.stringify(sampleObj, null, 2));

    // Should auto-convert with brackets (default array format)
    await expect(queryOutput).toHaveValue(/name=John%20Doe&age=30&hobbies\[\]=coding&hobbies\[\]=music/);

    // Switch array format to 'repeat'
    await page.selectOption('#array-format', 'repeat');
    await expect(queryOutput).toHaveValue(/name=John%20Doe&age=30&hobbies=coding&hobbies=music/);

    // Switch array format to 'comma'
    await page.selectOption('#array-format', 'comma');
    await expect(queryOutput).toHaveValue(/name=John%20Doe&age=30&hobbies=coding%2Cmusic/);
  });

  test('should convert Query String to JSON', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const queryOutput = page.locator('#query-output');

    // Fill query output/input
    await queryOutput.fill('first=hello&second=world&numbers[]=1&numbers[]=2');

    // Verify it updates JSON input correctly
    const jsonValue = await jsonInput.inputValue();
    const parsed = JSON.parse(jsonValue);
    expect(parsed.first).toBe('hello');
    expect(parsed.second).toBe('world');
    expect(parsed.numbers).toContain('1');
    expect(parsed.numbers).toContain('2');
  });

  test('should handle clear action and restore focus', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    const queryOutput = page.locator('#query-output');

    await jsonInput.fill('{"a": 1}');
    await expect(queryOutput).toHaveValue('a=1');

    // Click clear button
    const clearBtn = page.locator('button:has-text("Effacer")');
    await clearBtn.click();

    await expect(jsonInput).toBeEmpty();
    await expect(queryOutput).toBeEmpty();
    await expect(jsonInput).toBeFocused();
  });
});
