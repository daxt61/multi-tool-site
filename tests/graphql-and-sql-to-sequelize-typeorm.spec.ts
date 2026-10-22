import { test, expect } from '@playwright/test';

test.describe('GraphQL & SQL to Sequelize and TypeORM Converters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-sequelize');
  });

  test('GraphQL to Sequelize converts schema correctly with presets and options', async ({ page }) => {
    // Check main elements
    await expect(page.locator('h1')).toContainText('GraphQL to Sequelize');
    const inputArea = page.locator('#graphql-sequelize-input');
    const outputArea = page.locator('#sequelize-output');

    // Click quick preset
    const ecommerceBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
    await ecommerceBtn.click();
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'true');

    // Check generated output
    await expect(outputArea).toHaveValue(/export const initCategoryModel/);
    await expect(outputArea).toHaveValue(/export const initProductModel/);
    await expect(outputArea).toHaveValue(/OrderstatusEnum/i);

    // Switch model style to Class extends Model
    await page.selectOption('#sequelize-model-style', 'class');
    await expect(outputArea).toHaveValue(/export class Category extends Model/);
    await expect(outputArea).toHaveValue(/export class Product extends Model/);

    // Toggle options
    await page.selectOption('#sequelize-field-casing', 'snake_case');
    await expect(outputArea).toHaveValue(/is_active/);

    // Test Esc shortcut clear
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(ecommerceBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('GraphQL to TypeORM converts schema correctly with decorators and presets', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/graphql-to-typeorm');

    await expect(page.locator('h1')).toContainText('GraphQL to TypeORM');
    const inputArea = page.locator('#graphql-typeorm-input');
    const outputArea = page.locator('#typeorm-output');

    // Click quick preset
    const userAuthBtn = page.getByRole('button', { name: 'User Management & Auth' });
    await userAuthBtn.click();
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify generated TypeORM entity output
    await expect(outputArea).toHaveValue(/@Entity\('users'\)/);
    await expect(outputArea).toHaveValue(/export class User/);
    await expect(outputArea).toHaveValue(/@PrimaryGeneratedColumn\(\)/);
    await expect(outputArea).toHaveValue(/@CreateDateColumn\(\{ type: 'timestamp'/);

    // Toggle class-validator checkbox
    await page.check('#typeorm-validator');
    await expect(outputArea).toHaveValue(/@IsEmail\(\)/);
    await expect(outputArea).toHaveValue(/@IsNotEmpty\(\)/);

    // Test manual edit clears preset
    await inputArea.fill('type Simple { id: ID! name: String! }');
    await expect(userAuthBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(outputArea).toHaveValue(/export class Simple/);

    // Test copy shortcut
    await inputArea.focus();
    await page.keyboard.press('Tab'); // Move focus away from textareas
    await page.keyboard.press('c');
    await expect(page.locator('ol')).toContainText('TypeORM entities copied to clipboard');
  });

  test('SQL to Sequelize UX upgrade functions properly with presets and shortcuts', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/sql-to-sequelize');

    await expect(page.locator('h1')).toContainText('SQL DDL to Sequelize');
    const inputArea = page.locator('#sql-sequelize-input');
    const outputArea = page.locator('#sequelize-output');

    // Click preset
    const blogBtn = page.getByRole('button', { name: 'Blog CMS' });
    await blogBtn.click();
    await expect(blogBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify output
    await expect(outputArea).toHaveValue(/initPostModel/);
    await expect(outputArea).toHaveValue(/initCommentModel/);

    // Clear via Escape
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(blogBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
