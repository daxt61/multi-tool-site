import { test, expect } from '@playwright/test';

test('verify new JSON conversion tools', async ({ page }) => {
  // Test JSON to Swift
  await page.goto('http://localhost:5173/fr/outil/json-to-swift');
  await page.fill('#json-input', '{"name": "Swift", "version": 5}');
  await expect(page.locator('#swift-output')).toContainText('struct RootObject: Codable');
  await expect(page.locator('#swift-output')).toContainText('let name: String');

  // Test JSON to Ruby
  await page.goto('http://localhost:5173/fr/outil/json-to-ruby');
  await page.fill('#json-input', '{"name": "Ruby", "gems": ["rails", "rspec"]}');
  await expect(page.locator('#ruby-output')).toContainText('class RootObject');
  await expect(page.locator('#ruby-output')).toContainText('attr_accessor :name');

  // Test JSON to Scala
  await page.goto('http://localhost:5173/fr/outil/json-to-scala');
  await page.fill('#json-input', '{"name": "Scala", "fp": true}');
  await expect(page.locator('#scala-output')).toContainText('case class RootObject');
  await expect(page.locator('#scala-output')).toContainText('name: String');
});

test('verify Word Counter upgrades', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/word-counter');
  await page.fill('#word-counter-input', 'The quick brown fox jumps over the lazy dog. It was a sunny day. Readability is important.');
  await expect(page.getByText('Coleman-Liau')).toBeVisible();
  await expect(page.getByText('SMOG')).toBeVisible();
});

test('verify Color Converter upgrades', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/color-converter');
  await expect(page.getByText('Nuances et Teintes')).toBeVisible();
  await expect(page.getByText('Teintes (plus clair)')).toBeVisible();
  await expect(page.getByText('Nuances (plus sombre)')).toBeVisible();
});
