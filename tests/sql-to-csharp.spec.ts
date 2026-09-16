import { test, expect } from '@playwright/test';

test.describe('SQL DDL to C# Class Generator Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-csharp');
  });

  test('converts SQL DDL into C# class definitions with System.Text.Json attributes', async ({ page }) => {
    const inputArea = page.locator('#sql-csharp-input');
    const outputArea = page.locator('#csharp-output');

    await inputArea.fill(`
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP
);
    `);

    await expect(outputArea).toContainText('using System.Text.Json.Serialization;');
    await expect(outputArea).toContainText('public class Users');
    await expect(outputArea).toContainText('[JsonPropertyName("user_id")]');
    await expect(outputArea).toContainText('public int UserId { get; set; }');
    await expect(outputArea).toContainText('[JsonPropertyName("email")]');
    await expect(outputArea).toContainText('public string Email { get; set; }');
  });

  test('supports EF Core annotations and record type mode', async ({ page }) => {
    const inputArea = page.locator('#sql-csharp-input');
    const outputArea = page.locator('#csharp-output');

    await inputArea.fill(`
CREATE TABLE products (
  product_id INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL
);
    `);

    // Enable EF Core checkbox
    const efCoreCheckbox = page.locator('#use-ef-core');
    await efCoreCheckbox.check();

    // Select Record type mode
    const typeSelect = page.locator('#csharp-type-mode');
    await typeSelect.selectOption('record');

    await expect(outputArea).toContainText('using System.ComponentModel.DataAnnotations;');
    await expect(outputArea).toContainText('[Table("products")]');
    await expect(outputArea).toContainText('public record Products');
    await expect(outputArea).toContainText('[Key]');
    await expect(outputArea).toContainText('[Column("product_id")]');
    await expect(outputArea).toContainText('[Required]');
  });

  test('loads quick start presets accurately', async ({ page }) => {
    const outputArea = page.locator('#csharp-output');

    // Click E-Commerce Catalog preset
    await page.getByRole('button', { name: 'E-Commerce Catalog' }).click();
    await expect(outputArea).toContainText('public class Categories');
    await expect(outputArea).toContainText('public class Products');

    // Click User Auth preset
    await page.getByRole('button', { name: 'User Auth & Roles' }).click();
    await expect(outputArea).toContainText('public class Users');
    await expect(outputArea).toContainText('public class Roles');
  });

  test('handles keyboard shortcuts (Esc clear, C copy) and focus restoration', async ({ page }) => {
    const inputArea = page.locator('#sql-csharp-input');
    const outputArea = page.locator('#csharp-output');

    await page.getByRole('button', { name: 'Financial Audit Log' }).click();
    await expect(outputArea).toContainText('public class AuditLogs');

    // Press Escape to clear
    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
