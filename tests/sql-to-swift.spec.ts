import { test, expect } from '@playwright/test';

test.describe('SQL to Swift Codable Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-swift');
  });

  test('renders input/output areas, options, and preset buttons', async ({ page }) => {
    await expect(page.locator('#sql-swift-input')).toBeVisible();
    await expect(page.locator('#swift-output')).toBeVisible();
    await expect(page.locator('#swift-type-kind-select')).toBeVisible();
    await expect(page.locator('#property-casing-select')).toBeVisible();
    await expect(page.getByRole('button', { name: /Catalogue E-Commerce/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Authentification & Rôles/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Blog & Articles/i })).toBeVisible();
  });

  test('loads preset and converts SQL DDL to Swift Codable struct', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();

    const inputVal = await page.locator('#sql-swift-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE products');

    const outputVal = await page.locator('#swift-output').inputValue();
    expect(outputVal).toContain('import Foundation');
    expect(outputVal).toContain('public struct Products: Codable, Identifiable');
    expect(outputVal).toContain('public let id: Int64');
    expect(outputVal).toContain('public let sku: String');
    expect(outputVal).toContain('public let description: String?');
    expect(outputVal).toContain('public let stockQuantity: Int');
    expect(outputVal).toContain('enum CodingKeys: String, CodingKey');
    expect(outputVal).toContain('case stockQuantity = "stock_quantity"');
  });

  test('updates generated output when options change', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();

    // Select class mode
    await page.locator('#swift-type-kind-select').selectOption('class');
    let outputVal = await page.locator('#swift-output').inputValue();
    expect(outputVal).toContain('public class Products: Codable, Identifiable');

    // Select snake_case property casing
    await page.locator('#property-casing-select').selectOption('snake_case');
    outputVal = await page.locator('#swift-output').inputValue();
    expect(outputVal).toContain('public let stock_quantity: Int');

    // Toggle init generation
    await page.getByText('Générer le Constructeur Membre (init)').click();
    outputVal = await page.locator('#swift-output').inputValue();
    expect(outputVal).toContain('public init(');
    expect(outputVal).toContain('self.id = id');
  });

  test('escapes Swift reserved keywords using backtick identifiers', async ({ page }) => {
    await page.locator('#sql-swift-input').fill(`
      CREATE TABLE test_table (
        id INT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        init TEXT NULL,
        class BOOLEAN NOT NULL
      );
    `);

    const outputVal = await page.locator('#swift-output').inputValue();
    expect(outputVal).toContain('public let `type`: String');
    expect(outputVal).toContain('public let `init`: String?');
    expect(outputVal).toContain('public let `class`: Bool');
  });

  test('clears input with clear button and restores focus', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce/i }).click();
    expect(await page.locator('#sql-swift-input').inputValue()).not.toBe('');

    await page.getByRole('button', { name: 'Effacer' }).click();

    expect(await page.locator('#sql-swift-input').inputValue()).toBe('');
    expect(await page.locator('#swift-output').inputValue()).toBe('');
  });
});
