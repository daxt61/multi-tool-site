import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4173' });

test.describe('SQL to Drizzle & Kysely Generators', () => {
  test('SQL to Drizzle converts DDL, switches dialect and handles presets & shortcuts', async ({ page }) => {
    await page.goto('/en/outil/sql-to-drizzle');

    // Input DDL
    const input = page.locator('#sql-drizzle-input');
    const output = page.locator('#drizzle-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    // Click preset
    const ecommerceBtn = page.getByRole('button', { name: /E-Commerce|Catalogue E-Commerce/i });
    await expect(ecommerceBtn).toBeVisible();
    await ecommerceBtn.click();

    // Verify preset loaded and output generated
    await expect(output).toHaveValue(/import \{.*pgTable.*\} from 'drizzle-orm\/pg-core';/);
    await expect(output).toHaveValue(/export const categories = pgTable\('categories',/);

    // Switch dialect to MySQL
    const dialectSelect = page.locator('#drizzle-dialect');
    await dialectSelect.selectOption('mysql');
    await expect(output).toHaveValue(/import \{.*mysqlTable.*\} from 'drizzle-orm\/mysql-core';/);
    await expect(output).toHaveValue(/export const categories = mysqlTable\('categories',/);

    // Test Esc shortcut to clear
    await input.focus();
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('SQL to Kysely converts DDL, handles presets and exports interfaces', async ({ page }) => {
    await page.goto('/en/outil/sql-to-kysely');

    const input = page.locator('#sql-kysely-input');
    const output = page.locator('#kysely-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    // Click User Auth & Roles preset
    const userAuthBtn = page.getByRole('button', { name: /User Auth & Roles|Authentification & Rôles/i });
    await expect(userAuthBtn).toBeVisible();
    await userAuthBtn.click();

    // Verify output contains Generated and Kysely types
    await expect(output).toHaveValue(/import \{.*Generated.*\} from 'kysely';/);
    await expect(output).toHaveValue(/export interface UserTable \{/);
    await expect(output).toHaveValue(/userId: Generated<string>;/);
    await expect(output).toHaveValue(/export interface Database \{/);
    await expect(output).toHaveValue(/users: UserTable;/);

    // Toggle PK Generated off
    const generatedCheckbox = page.locator('#kysely-use-generated');
    await generatedCheckbox.uncheck();
    await expect(output).not.toHaveValue(/Generated<string>/);
    await expect(output).toHaveValue(/userId: string;/);

    // Test Esc shortcut
    await input.focus();
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });
});
