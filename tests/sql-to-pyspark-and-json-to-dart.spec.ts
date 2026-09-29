import { test, expect } from '@playwright/test';

test.describe('SQL to PySpark & JSON to Dart Tools', () => {
  test('SQL to PySpark - converts SQL DDL to PySpark StructType schema, handles presets, options, and clear', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-pyspark');

    // Verify page title and header
    await expect(page.locator('h1')).toContainText('SQL DDL en PySpark');

    // Test clicking preset
    await page.click('button:has-text("Catalogue E-Commerce")');
    const inputVal = await page.inputValue('#sql-pyspark-input');
    expect(inputVal).toContain('CREATE TABLE products');

    // Verify output generated
    const outputVal = await page.inputValue('#pyspark-output');
    expect(outputVal).toContain('products_schema = StructType([');
    expect(outputVal).toContain('StructField("id", IntegerType(), True)');
    expect(outputVal).toContain('StructField("name", StringType(), False)');

    // Test switching output format to PySpark DDL String
    await page.selectOption('#output-style-select', 'ddl_string');
    const ddlOutput = await page.inputValue('#pyspark-output');
    expect(ddlOutput).toContain('products_schema_ddl = "id INT, name STRING NOT NULL');

    // Test switching to Full DataFrame Code Snippet
    await page.selectOption('#output-style-select', 'dataframe_snippet');
    const snippetOutput = await page.inputValue('#pyspark-output');
    expect(snippetOutput).toContain('SparkSession.builder');
    expect(snippetOutput).toContain('df_products = spark.createDataFrame');

    // Test Field Casing option (camelCase)
    await page.selectOption('#field-casing-select', 'camelCase');
    const camelOutput = await page.inputValue('#pyspark-output');
    expect(camelOutput).toContain('stockQuantity');

    // Test Escape key clears inputs and restores focus to #sql-pyspark-input
    await page.keyboard.press('Escape');
    await expect(page.locator('#sql-pyspark-input')).toHaveValue('');
    await expect(page.locator('#sql-pyspark-input')).toBeFocused();
  });

  test('JSON to Dart - converts JSON to Dart classes, handles presets, options, and shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-dart');

    // Verify page title
    await expect(page.locator('h1')).toContainText('JSON en Dart');

    // Click quick preset
    await page.click('button:has-text("Profil Utilisateur")');
    const inputVal = await page.inputValue('#json-input');
    expect(inputVal).toContain('alex_flutter');

    // Verify output
    const outputVal = await page.inputValue('#dart-output');
    expect(outputVal).toContain('class RootObject');
    expect(outputVal).toContain('final String? username;');
    expect(outputVal).toContain('factory RootObject.fromJson(Map<String, dynamic> json)');

    // Test toggling copyWith method
    const copyWithCheckbox = page.locator('label:has-text("Générer la méthode copyWith") input[type="checkbox"]');
    await copyWithCheckbox.check();
    const copyWithOutput = await page.inputValue('#dart-output');
    expect(copyWithOutput).toContain('RootObject copyWith({');

    // Test class prefix
    await page.fill('#prefix-mod', 'App');
    const prefixOutput = await page.inputValue('#dart-output');
    expect(prefixOutput).toContain('class AppRootObject');

    // Test Escape key clears inputs and restores focus to #json-input
    await page.keyboard.press('Escape');
    await expect(page.locator('#json-input')).toHaveValue('');
    await expect(page.locator('#json-input')).toBeFocused();
  });
});
