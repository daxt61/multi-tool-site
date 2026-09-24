import { test, expect } from '@playwright/test';

test.describe('SQLToSequelize Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#sql-to-sequelize');
  });

  test('converts SQL DDL into Sequelize TypeScript define models by default', async ({ page }) => {
    const input = page.locator('#sql-sequelize-input');
    const output = page.locator('#sequelize-output');

    await expect(input).toBeVisible();
    await input.fill(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP
      );
    `);

    await expect(output).toContainText("import { Sequelize, DataTypes } from 'sequelize';");
    await expect(output).toContainText('export const initUserModel = (sequelize: Sequelize) => {');
    await expect(output).toContainText('type: DataTypes.INTEGER');
    await expect(output).toContainText('primaryKey: true');
    await expect(output).toContainText('autoIncrement: true');
    await expect(output).toContainText('type: DataTypes.STRING(50)');
    await expect(output).toContainText('allowNull: false');
    await expect(output).toContainText('unique: true');
    await expect(output).toContainText('tableName: \'users\'');
  });

  test('supports Class extends Model style in JavaScript', async ({ page }) => {
    const input = page.locator('#sql-sequelize-input');
    const output = page.locator('#sequelize-output');
    const styleSelect = page.locator('#sequelize-model-style');
    const langSelect = page.locator('#sequelize-language');

    await styleSelect.selectOption('class');
    await langSelect.selectOption('js');

    await input.fill(`
      CREATE TABLE products (
        product_id INT PRIMARY KEY,
        price DECIMAL(10, 2) NOT NULL,
        title VARCHAR(255)
      );
    `);

    await expect(output).toContainText("const { Model, DataTypes } = require('sequelize');");
    await expect(output).toContainText('class Product extends Model {');
    await expect(output).toContainText('static initModel(sequelize) {');
    await expect(output).toContainText('type: DataTypes.DECIMAL(10, 2)');
    await expect(output).toContainText('module.exports = Product;');
  });

  test('loads quick presets and updates output', async ({ page }) => {
    const output = page.locator('#sequelize-output');
    const ecommercePreset = page.getByRole('button', { name: 'E-Commerce Catalog' });

    await expect(ecommercePreset).toBeVisible();
    await ecommercePreset.click();

    await expect(output).toContainText('Category');
    await expect(output).toContainText('Product');
    await expect(output).toContainText('DataTypes.DECIMAL(10, 2)');
  });

  test('clears input with Esc key shortcut', async ({ page }) => {
    const input = page.locator('#sql-sequelize-input');
    const output = page.locator('#sequelize-output');

    await input.fill('CREATE TABLE test (id INT);');
    await expect(output).not.toHaveValue('');

    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });
});
