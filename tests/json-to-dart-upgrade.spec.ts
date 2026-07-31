import { test, expect } from '@playwright/test';

test('JSON to Dart premium upgrade options and UX', async ({ page, baseURL }) => {
  // Navigate to English version of the tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/json-to-dart`);

  const jsonInput = page.locator('#json-input');
  const dartOutput = page.locator('#dart-output');

  // Verify elements exist
  await expect(jsonInput).toBeVisible();
  await expect(dartOutput).toBeVisible();

  // Test Case 1: Convert a simple object and check defaults (Null-Safety is checked, toJson is checked)
  await jsonInput.fill('{"id": 42, "name": "Dart Lang", "tags": ["programming", "flutter"]}');

  // By default: Null safety (?) should be enabled and serializer (fromJson/toJson) should be present
  await expect(dartOutput).toContainText('final int? id;');
  await expect(dartOutput).toContainText('final String? name;');
  await expect(dartOutput).toContainText('final List<String>? tags;');
  await expect(dartOutput).toContainText('factory RootObject.fromJson');
  await expect(dartOutput).toContainText('Map<String, dynamic> toJson()');

  // Test Case 2: Toggle Null safety off
  const nullSafetyCheckbox = page.locator('input[type="checkbox"]').first(); // First one should be null safety
  await nullSafetyCheckbox.click();
  await expect(dartOutput).toContainText('final int id;');
  await expect(dartOutput).toContainText('final String name;');

  // Test Case 3: Toggle copyWith and toString on
  const copyWithCheckbox = page.locator('input[type="checkbox"]').nth(2); // copyWith checkbox
  const toStringCheckbox = page.locator('input[type="checkbox"]').nth(3); // toString checkbox

  await copyWithCheckbox.click();
  await expect(dartOutput).toContainText('RootObject copyWith({');

  await toStringCheckbox.click();
  await expect(dartOutput).toContainText('String toString() {');

  // Test Case 4: Class Modifiers (Prefix & Suffix)
  const prefixInput = page.locator('#prefix-mod');
  const suffixInput = page.locator('#suffix-mod');

  await prefixInput.fill('My');
  await suffixInput.fill('Response');

  await expect(dartOutput).toContainText('class MyRootObjectResponse {');

  // Test Case 5: Keyboard Shortcuts - Escape to clear
  await jsonInput.focus();
  await page.keyboard.press('Escape');
  await expect(jsonInput).toHaveValue('');
  await expect(dartOutput).toHaveValue('');
});
