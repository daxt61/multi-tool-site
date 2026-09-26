import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Mongoose Schema Generator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-mongoose');
  });

  test('renders tool header, inputs, and controls properly', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('SQL DDL en Mongoose');
    await expect(page.locator('#sql-mongoose-input')).toBeVisible();
    await expect(page.locator('#mongoose-output')).toBeVisible();
  });

  test('converts SQL DDL to Mongoose TypeScript interface and Schema', async ({ page }) => {
    await page.locator('#sql-mongoose-input').fill(`
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);

    const output = await page.locator('#mongoose-output').inputValue();
    expect(output).toContain('export interface IUser extends Document');
    expect(output).toContain('email: string;');
    expect(output).toContain('isActive?: boolean;');
    expect(output).toContain('export const UserSchema = new Schema<IUser>({');
    expect(output).toContain('email: { type: String, required: true, unique: true }');
    expect(output).toContain('isActive: { type: Boolean, default: true }');
    expect(output).toContain('{ timestamps: true }');
  });

  test('switches output format to JavaScript Schema & Model', async ({ page }) => {
    await page.locator('#sql-mongoose-input').fill(`
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL
);`);

    await page.locator('#mongoose-output-style').selectOption('javascript');
    const output = await page.locator('#mongoose-output').inputValue();

    expect(output).toContain("const mongoose = require('mongoose');");
    expect(output).not.toContain('export interface IPost');
    expect(output).toContain('export const PostSchema = new Schema({');
    expect(output).toContain("export const Post: Model = mongoose.models.Post || mongoose.model('Post', PostSchema);");
  });

  test('switches field casing to snake_case', async ({ page }) => {
    await page.locator('#sql-mongoose-input').fill(`
CREATE TABLE products (
  id INT PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL
);`);

    await page.locator('#mongoose-casing').selectOption('snake_case');
    const output = await page.locator('#mongoose-output').inputValue();

    expect(output).toContain('product_name: { type: String, required: true }');
  });

  test('loads quick start presets and clears input on Esc keypress', async ({ page }) => {
    await page.getByRole('button', { name: 'Blog CMS & Commentaires' }).click();
    let output = await page.locator('#mongoose-output').inputValue();
    expect(output).toContain('IAuthor');
    expect(output).toContain('IPost');

    // Press Escape to clear
    await page.locator('#sql-mongoose-input').focus();
    await page.keyboard.press('Escape');

    const inputVal = await page.locator('#sql-mongoose-input').inputValue();
    expect(inputVal).toBe('');
  });
});
