import { test, expect } from '@playwright/test';

test('verify ZodSchemaGenerator upgrades', async ({ page }) => {
  // Navigation to the Zod Schema Generator tool path
  await page.goto('http://localhost:5173/fr/outil/zod-schema');

  // Verify elements are present
  const inputLabel = page.locator('label[for="json-input"]');
  await expect(inputLabel).toBeVisible();

  const jsonTextarea = page.locator('textarea#json-input');
  await expect(jsonTextarea).toBeVisible();

  // Load a custom JSON payload
  const sampleJson = {
    username: "john_doe",
    email: "john@example.com",
    score: 42,
    isActive: true
  };
  await jsonTextarea.fill(JSON.stringify(sampleJson, null, 2));

  // Verify compiled zod output container
  const zodOutput = page.locator('pre#zod-output');
  await expect(zodOutput).toBeVisible();

  // Expect it contains fields converted
  const resultText = await zodOutput.textContent();
  expect(resultText).toContain('username: z.string()');
  expect(resultText).toContain('email: z.string().email()'); // Format detection active
  expect(resultText).toContain('score: z.number().int().positive()'); // Numbers detection active

  // Test disallow empty strings toggle (disallow empty strings)
  const minOneStringToggle = page.locator('button[aria-label="Interdire les chaînes de caractères vides"]');
  if (await minOneStringToggle.count() > 0) {
    await minOneStringToggle.click();
    const resultWithMinText = await zodOutput.textContent();
    expect(resultWithMinText).toContain('z.string().min(1)');
  }

  // Test change output style
  const outputStyleSelect = page.locator('select#output-style');
  await outputStyleSelect.selectOption('schema_only');
  const schemaOnlyText = await zodOutput.textContent();
  expect(schemaOnlyText).not.toContain('import { z } from "zod";');

  // Test custom variable name
  await outputStyleSelect.selectOption('full');
  const variableInput = page.locator('input#variable-name');
  await variableInput.fill('userProfileSchema');
  const customVarText = await zodOutput.textContent();
  expect(customVarText).toContain('export const userProfileSchema =');

  // Test quick presets
  const orderPresetBtn = page.getByRole('button', { name: 'Commande E-Commerce' });
  await expect(orderPresetBtn).toBeVisible();
  await orderPresetBtn.click();
  const presetText = await zodOutput.textContent();
  expect(presetText).toContain('orderId: z.string()');
  expect(presetText).toContain('totalAmount: z.number().positive()');

  // Test coerce types toggle
  const coerceToggle = page.locator('button[aria-label="Coercition de types (z.coerce)"]');
  await expect(coerceToggle).toBeVisible();
  await coerceToggle.click();
  const coerceText = await zodOutput.textContent();
  expect(coerceText).toContain('z.coerce.string()');
  expect(coerceText).toContain('z.coerce.number()');

  // Test readonly modifier toggle
  const readonlyToggle = page.locator('button[aria-label="Schéma en lecture seule (.readonly())"]');
  await expect(readonlyToggle).toBeVisible();
  await readonlyToggle.click();
  const readonlyText = await zodOutput.textContent();
  expect(readonlyText).toContain('.readonly()');

  // Test prototype pollution sanitization
  const pollutionJson = JSON.parse('{"__proto__": "malicious", "constructor": "dangerous", "prototype": "polluted", "normalKey": "safe"}');
  await jsonTextarea.fill(JSON.stringify(pollutionJson, null, 2));
  const sanitizedText = await zodOutput.textContent();
  expect(sanitizedText).toContain('___proto__:');
  expect(sanitizedText).toContain('_constructor:');
  expect(sanitizedText).toContain('_prototype:');
  expect(sanitizedText).toContain('normalKey:');

  // Test clear shortcut (Escape)
  await jsonTextarea.focus();
  await page.keyboard.press('Escape');
  const clearedText = await zodOutput.textContent();
  expect(clearedText).toContain('Le code Zod apparaîtra ici');
});
