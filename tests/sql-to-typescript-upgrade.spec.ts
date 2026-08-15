import { test, expect } from '@playwright/test';

test.describe('SQL to TypeScript & Zod Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-typescript');
  });

  test('should render properly and convert SQL DDL to TypeScript interfaces', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL to TypeScript');

    const sqlInput = page.locator('#sql-input');
    await sqlInput.fill(`CREATE TABLE users (
      user_id INT PRIMARY KEY,
      user_name VARCHAR(100) NOT NULL,
      email VARCHAR(255)
    );`);

    const tsOutput = page.locator('#ts-output');
    await expect(tsOutput).toContainText('export interface Users {');
    await expect(tsOutput).toContainText('userId: number;');
    await expect(tsOutput).toContainText('userName: string;');
    await expect(tsOutput).toContainText('email?: string;');
  });

  test('should support property casing and output mode options (Type Alias and Zod Schema)', async ({ page }) => {
    const sqlInput = page.locator('#sql-input');
    await sqlInput.fill(`CREATE TABLE orders (
      order_id INT PRIMARY KEY,
      total_price DECIMAL(10,2) NOT NULL
    );`);

    const outputModeSelect = page.locator('#output-mode');
    await outputModeSelect.selectOption('type');

    const tsOutput = page.locator('#ts-output');
    await expect(tsOutput).toContainText('export type Orders = {');

    await outputModeSelect.selectOption('zod');
    await expect(tsOutput).toContainText('import { z } from "zod";');
    await expect(tsOutput).toContainText('export const ordersSchema = z.object({');
    await expect(tsOutput).toContainText('orderId: z.number(),');
  });

  test('should load clickable presets', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await ecommercePreset.click();

    const tsOutput = page.locator('#ts-output');
    await expect(tsOutput).toContainText('export interface Categories {');
    await expect(tsOutput).toContainText('export interface Products {');
  });

  test('should handle keyboard shortcuts (Esc to clear)', async ({ page }) => {
    const ecommercePreset = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await ecommercePreset.click();

    const tsOutput = page.locator('#ts-output');
    await expect(tsOutput).not.toHaveValue('');

    const sqlInput = page.locator('#sql-input');
    await sqlInput.blur();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(sqlInput).toHaveValue('');
    await expect(tsOutput).toHaveValue('');
    await expect(sqlInput).toBeFocused();
  });
});
