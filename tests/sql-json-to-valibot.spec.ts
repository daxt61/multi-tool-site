import { test, expect } from '@playwright/test';

test.describe('SQL & JSON to Valibot Converter Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/outil/sql-to-valibot');
    await page.waitForLoadState('networkidle');
  });

  test('SQL to Valibot converts SQL DDL to Valibot schema', async ({ page }) => {
    const input = page.locator('#sql-valibot-input');
    const output = page.locator('#valibot-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    await input.fill(`CREATE TABLE users (
      user_id UUID PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      login_count INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL
    );`);

    await expect(output).toHaveValue(/import \* as v from 'valibot';/);
    await expect(output).toHaveValue(/export const usersSchema = v\.object\(\{/);
    await expect(output).toHaveValue(/userId: v\.pipe\(v\.string\(\), v\.uuid\(\)\),/);
    await expect(output).toHaveValue(/email: v\.pipe\(v\.string\(\), v\.email\(\)\),/);
    await expect(output).toHaveValue(/loginCount: v\.optional\(v\.pipe\(v\.number\(\), v\.integer\(\)\)\),/);
    await expect(output).toHaveValue(/isActive: v\.optional\(v\.boolean\(\)\),/);
    await expect(output).toHaveValue(/createdAt: v\.date\(\)/);
    await expect(output).toHaveValue(/export type Users = v\.InferOutput<typeof usersSchema>;/);
  });

  test('SQL to Valibot supports quick presets and clearing input', async ({ page }) => {
    const input = page.locator('#sql-valibot-input');
    const output = page.locator('#valibot-output');

    const ecommerceBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(ecommerceBtn).toBeVisible();
    await ecommerceBtn.click();

    await expect(input).toHaveValue(/CREATE TABLE categories/);
    await expect(output).toHaveValue(/export const categoriesSchema = v\.object\(\{/);
    await expect(output).toHaveValue(/export const productsSchema = v\.object\(\{/);

    const clearBtn = page.getByRole('button', { name: 'Clear' });
    await clearBtn.click();

    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('JSON to Valibot converts JSON payload and supports presets', async ({ page }) => {
    await page.goto('/en/outil/json-to-valibot');
    await page.waitForLoadState('networkidle');

    const jsonInput = page.locator('#json-valibot-input');
    const valibotOutput = page.locator('#valibot-output');

    await expect(jsonInput).toBeVisible();
    await expect(valibotOutput).toBeVisible();

    await jsonInput.fill(JSON.stringify({
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "test@example.com",
      count: 42,
      price: 19.99,
      isVerified: true
    }, null, 2));

    await expect(valibotOutput).toHaveValue(/import \* as v from 'valibot';/);
    await expect(valibotOutput).toHaveValue(/export const MySchema = v\.object\(\{/);
    await expect(valibotOutput).toHaveValue(/id: v\.pipe\(v\.string\(\), v\.uuid\(\)\),/);
    await expect(valibotOutput).toHaveValue(/email: v\.pipe\(v\.string\(\), v\.email\(\)\),/);
    await expect(valibotOutput).toHaveValue(/count: v\.pipe\(v\.number\(\), v\.integer\(\)\),/);
    await expect(valibotOutput).toHaveValue(/price: v\.number\(\),/);
    await expect(valibotOutput).toHaveValue(/isVerified: v\.boolean\(\)/);
    await expect(valibotOutput).toHaveValue(/export type MySchemaType = v\.InferOutput<typeof MySchema>;/);

    const presetBtn = page.getByRole('button', { name: 'E-Commerce Order' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    await expect(jsonInput).toHaveValue(/ORD-2025-991/);
    await expect(valibotOutput).toHaveValue(/orderId:/);
    await expect(valibotOutput).toHaveValue(/totalAmount:/);
  });
});
