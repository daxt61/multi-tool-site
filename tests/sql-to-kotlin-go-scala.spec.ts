import { test as baseTest, expect } from '@playwright/test';

const test = baseTest.extend({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);
    page.goto = (url: string, options?: any) => {
      const targetUrl = url.startsWith('/') ? `http://localhost:5173${url}` : url;
      return originalGoto(targetUrl, options);
    };
    await use(page);
  },
});

test.describe('SQLToKotlin, SQLToGo, and JSONToScala Tools', () => {
  test('SQL to Kotlin converts DDL statements to Kotlin data classes with presets and options', async ({ page }) => {
    await page.goto('/fr/outil/sql-to-kotlin');

    // Verify main elements exist
    await expect(page.locator('#sql-kotlin-input')).toBeVisible();
    await expect(page.locator('#kotlin-output')).toBeVisible();

    // Load preset
    await page.click('button:has-text("Catalogue E-Commerce")');
    const inputValue = await page.inputValue('#sql-kotlin-input');
    expect(inputValue).toContain('CREATE TABLE categories');
    expect(inputValue).toContain('CREATE TABLE products');

    // Check output contains Kotlin data classes
    const outputValue = await page.inputValue('#kotlin-output');
    expect(outputValue).toContain('data class Categories(');
    expect(outputValue).toContain('data class Products(');
    expect(outputValue).toContain('@SerialName("category_id")');

    // Change framework option to Jackson
    await page.selectOption('#kotlin-framework', 'jackson');
    const jacksonOutput = await page.inputValue('#kotlin-output');
    expect(jacksonOutput).toContain('@JsonProperty("category_id")');

    // Test Escape key clears inputs
    await page.focus('body');
    await page.keyboard.press('Escape');
    await expect(page.locator('#sql-kotlin-input')).toHaveValue('');
    await expect(page.locator('#kotlin-output')).toHaveValue('');
  });

  test('SQL to Go converts DDL statements to Go structs with field tags and pointers', async ({ page }) => {
    await page.goto('/fr/outil/sql-to-go');

    // Verify main elements exist
    await expect(page.locator('#sql-go-input')).toBeVisible();
    await expect(page.locator('#go-output')).toBeVisible();

    // Load preset
    await page.click('button:has-text("Authentification & Rôles")');
    const inputValue = await page.inputValue('#sql-go-input');
    expect(inputValue).toContain('CREATE TABLE users');
    expect(inputValue).toContain('CREATE TABLE roles');

    // Check output contains Go structs and JSON tags
    let outputValue = await page.inputValue('#go-output');
    expect(outputValue).toContain('package models');
    expect(outputValue).toContain('type Users struct {');
    expect(outputValue).toContain('UserID');
    expect(outputValue).toContain('json:"email"');

    // Enable GORM tags
    await page.check('#use-gorm-tag');
    outputValue = await page.inputValue('#go-output');
    expect(outputValue).toContain('gorm:"column:user_id;primaryKey;not null"');

    // Test Escape key clears inputs
    await page.focus('body');
    await page.keyboard.press('Escape');
    await expect(page.locator('#sql-go-input')).toHaveValue('');
    await expect(page.locator('#go-output')).toHaveValue('');
  });

  test('JSON to Scala converts JSON payloads to Scala case classes with Circe/Play frameworks', async ({ page }) => {
    await page.goto('/fr/outil/json-to-scala');

    // Verify main elements exist
    await expect(page.locator('#json-scala-input')).toBeVisible();
    await expect(page.locator('#scala-output')).toBeVisible();

    // Load preset
    await page.click('button:has-text("Profil Utilisateur")');
    const inputValue = await page.inputValue('#json-scala-input');
    expect(inputValue).toContain('scala_dev');

    // Check output contains Scala case class
    let outputValue = await page.inputValue('#scala-output');
    expect(outputValue).toContain('case class RootObject(');
    expect(outputValue).toContain('case class Profile(');
    expect(outputValue).toContain('@configured');

    // Switch framework to Play JSON
    await page.selectOption('#scala-framework', 'play');
    outputValue = await page.inputValue('#scala-output');
    expect(outputValue).toContain('import play.api.libs.json._');
    expect(outputValue).toContain('object Formats {');
    expect(outputValue).toContain('implicit val rootobjectFormat: OFormat[RootObject]');

    // Test Escape key clears inputs
    await page.focus('body');
    await page.keyboard.press('Escape');
    await expect(page.locator('#json-scala-input')).toHaveValue('');
    await expect(page.locator('#scala-output')).toHaveValue('');
  });
});
