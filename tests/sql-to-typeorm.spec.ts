import { test, expect } from '@playwright/test';

test.describe('SQL DDL to TypeORM Entity Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-typeorm');
  });

  test('renders tool title and elements correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL DDL to TypeORM');
    await expect(page.locator('label[for="sql-typeorm-input"]')).toBeVisible();
    await expect(page.locator('label[for="typeorm-output"]')).toBeVisible();
    await expect(page.locator('#sql-typeorm-input')).toBeVisible();
    await expect(page.locator('#typeorm-output')).toBeVisible();
  });

  test('loads quick preset and generates TypeORM entities', async ({ page }) => {
    // Click on E-Commerce Catalog preset
    await page.click('button:has-text("E-Commerce Catalog")');

    // Input should be populated with SQL
    const inputVal = await page.locator('#sql-typeorm-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE categories');
    expect(inputVal).toContain('CREATE TABLE products');

    // Output should contain TypeORM decorators
    const outputVal = await page.locator('#typeorm-output').inputValue();
    expect(outputVal).toContain("import { Entity, Column, PrimaryGeneratedColumn");
    expect(outputVal).toContain("@Entity('categories')");
    expect(outputVal).toContain('export class Category {');
    expect(outputVal).toContain('@PrimaryGeneratedColumn()');
    expect(outputVal).toContain('categoryId!: number;');
    expect(outputVal).toContain("@Entity('products')");
    expect(outputVal).toContain('export class Product {');
  });

  test('handles option toggles correctly', async ({ page }) => {
    await page.click('button:has-text("E-Commerce Catalog")');

    // Toggle class-validator
    await page.check('#typeorm-validator');
    let outputVal = await page.locator('#typeorm-output').inputValue();
    expect(outputVal).toContain("import { IsNotEmpty, IsOptional");
    expect(outputVal).toContain('@IsNotEmpty()');

    // Toggle off constructor
    await page.uncheck('#typeorm-constructor');
    outputVal = await page.locator('#typeorm-output').inputValue();
    expect(outputVal).not.toContain('constructor(init?: Partial<Category>)');
  });

  test('handles clear button and restores focus to input', async ({ page }) => {
    await page.click('button:has-text("E-Commerce Catalog")');
    expect(await page.locator('#sql-typeorm-input').inputValue()).not.toBe('');

    await page.click('button:has-text("Clear")');
    expect(await page.locator('#sql-typeorm-input').inputValue()).toBe('');
    expect(await page.locator('#typeorm-output').inputValue()).toBe('');

    // Check focus is restored
    await expect(page.locator('#sql-typeorm-input')).toBeFocused();
  });

  test('supports Escape shortcut key to clear', async ({ page }) => {
    await page.click('button:has-text("E-Commerce Catalog")');
    expect(await page.locator('#sql-typeorm-input').inputValue()).not.toBe('');

    await page.keyboard.press('Escape');
    expect(await page.locator('#sql-typeorm-input').inputValue()).toBe('');
    expect(await page.locator('#typeorm-output').inputValue()).toBe('');
  });
});

test.describe('SQL DDL to Sequelize Default Values Fix', () => {
  test('formats CURRENT_TIMESTAMP and unquoted string defaults properly in Sequelize', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-sequelize');

    await page.fill('#sql-sequelize-input', `CREATE TABLE events (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_name VARCHAR(100) DEFAULT 'unnamed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);

    const outputVal = await page.locator('#sequelize-output').inputValue();
    expect(outputVal).toContain('defaultValue: DataTypes.NOW');
    expect(outputVal).toContain("defaultValue: 'unnamed'");
  });
});
