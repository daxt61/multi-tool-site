import { test, expect } from '@playwright/test';

test('verify Ctrl+Enter keyboard shortcut in JSONToTS tool', async ({ page }) => {
  // Navigate to the JSON to TypeScript tool
  await page.goto('http://localhost:5173/fr/outil/json-to-ts');

  const jsonInput = page.locator('#json-input');
  const tsOutput = page.locator('#ts-output');

  // Initial output should be empty or placeholder
  await expect(tsOutput).toHaveValue('');

  // Enter some JSON
  await jsonInput.fill('{"name": "Palette", "role": "UX Agent"}');

  // Trigger the shortcut Ctrl+Enter
  await jsonInput.press('Control+Enter');

  // Verify the output is generated
  const outputValue = await tsOutput.inputValue();
  expect(outputValue).toContain('interface RootObject');
  expect(outputValue).toContain('name: string;');
  expect(outputValue).toContain('role: string;');
});
