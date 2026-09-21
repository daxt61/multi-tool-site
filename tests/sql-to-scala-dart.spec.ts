import { test, expect } from '@playwright/test';

test.describe('SQL to Scala Case Class Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-scala');
  });

  test('renders input/output textareas, controls, and presets', async ({ page }) => {
    await expect(page.locator('#sql-scala-input')).toBeVisible();
    await expect(page.locator('#scala-output')).toBeVisible();
    await expect(page.locator('#scala-version')).toBeVisible();
    await expect(page.locator('#scala-framework')).toBeVisible();
    await expect(page.locator('#scala-casing')).toBeVisible();
    await expect(page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i })).toBeVisible();
  });

  test('loads preset and converts SQL DDL to Scala case classes', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();

    const inputVal = await page.locator('#sql-scala-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE products');

    const outputVal = await page.locator('#scala-output').inputValue();
    expect(outputVal).toContain('final case class Products');
    expect(outputVal).toContain('id: Int');
    expect(outputVal).toContain('sku: String');
    expect(outputVal).toContain('description: Option[String]');
    expect(outputVal).toContain('price: BigDecimal');
    expect(outputVal).toContain('isActive: Boolean');
  });

  test('updates generated output when framework options change', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();

    // Select Play JSON
    await page.locator('#scala-framework').selectOption('play');
    let outputVal = await page.locator('#scala-output').inputValue();
    expect(outputVal).toContain('import play.api.libs.json._');
    expect(outputVal).toContain('implicit val productsFormat: play.api.libs.json.OFormat[Products] = play.api.libs.json.Json.format[Products]');

    // Select Jackson
    await page.locator('#scala-framework').selectOption('jackson');
    outputVal = await page.locator('#scala-output').inputValue();
    expect(outputVal).toContain('@com.fasterxml.jackson.annotation.JsonProperty("stock_quantity") stockQuantity');
  });

  test('escapes Scala reserved keywords using backticks', async ({ page }) => {
    await page.locator('#sql-scala-input').fill(`
      CREATE TABLE test_table (
        id INT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        match TEXT
      );
    `);

    const outputVal = await page.locator('#scala-output').inputValue();
    expect(outputVal).toContain('`type`: String');
    expect(outputVal).toContain('`match`: Option[String]');
  });
});

test.describe('SQL to Dart Model Class Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-dart');
  });

  test('renders input/output textareas, controls, and presets', async ({ page }) => {
    await expect(page.locator('#sql-dart-input')).toBeVisible();
    await expect(page.locator('#dart-output')).toBeVisible();
    await expect(page.locator('#dart-construct')).toBeVisible();
    await expect(page.locator('#dart-casing')).toBeVisible();
    await expect(page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i })).toBeVisible();
  });

  test('loads preset and converts SQL DDL to plain Dart class', async ({ page }) => {
    await page.getByRole('button', { name: /Catalogue E-Commerce|E-Commerce Catalog/i }).click();

    const inputVal = await page.locator('#sql-dart-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE products');

    const outputVal = await page.locator('#dart-output').inputValue();
    expect(outputVal).toContain('class Products');
    expect(outputVal).toContain('final int id;');
    expect(outputVal).toContain('final String sku;');
    expect(outputVal).toContain('final String? description;');
    expect(outputVal).toContain('final double price;');
    expect(outputVal).toContain('factory Products.fromJson(Map<String, dynamic> json)');
    expect(outputVal).toContain('Map<String, dynamic> toJson()');
    expect(outputVal).toContain('Products copyWith({');
  });

  test('updates generated output for freezed model style', async ({ page }) => {
    await page.getByRole('button', { name: /User Auth & Roles|Authentification/i }).click();

    await page.locator('#dart-construct').selectOption('freezed');
    const outputVal = await page.locator('#dart-output').inputValue();
    expect(outputVal).toContain("@freezed");
    expect(outputVal).toContain("class Users with _$Users {");
    expect(outputVal).toContain("const factory Users({");
    expect(outputVal).toContain("factory Users.fromJson(Map<String, dynamic> json) => _$UsersFromJson(json);");
  });

  test('escapes Dart reserved keywords by appending underscore', async ({ page }) => {
    await page.locator('#sql-dart-input').fill(`
      CREATE TABLE test_table (
        id INT PRIMARY KEY,
        class VARCHAR(50) NOT NULL,
        final TEXT
      );
    `);

    const outputVal = await page.locator('#dart-output').inputValue();
    expect(outputVal).toContain('final String class_;');
    expect(outputVal).toContain('final String? final_;');
  });
});
