import { test, expect } from '@playwright/test';

test.describe('SQL DDL to Django Models Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-django');
  });

  test('renders tool title and elements correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#sql-django-input')).toBeVisible();
    await expect(page.locator('#django-output')).toBeVisible();
    await expect(page.locator('#django-field-casing')).toHaveValue('snake_case');
    await expect(page.locator('#allow-null-blank')).toBeChecked();
    await expect(page.locator('#generate-str')).toBeChecked();
    await expect(page.locator('#generate-meta')).toBeChecked();
    await expect(page.locator('#generate-admin')).toBeChecked();
  });

  test('loads quick preset and generates Django models', async ({ page }) => {
    // Click E-Commerce Catalog preset
    await page.getByRole('button', { name: /E-Commerce/i }).first().click();

    const inputVal = await page.locator('#sql-django-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE categories');
    expect(inputVal).toContain('CREATE TABLE products');

    const outputVal = await page.locator('#django-output').inputValue();
    expect(outputVal).toContain('from django.db import models');
    expect(outputVal).toContain('class Category(models.Model):');
    expect(outputVal).toContain('class Product(models.Model):');
    expect(outputVal).toContain("category = models.ForeignKey('Category', on_delete=models.CASCADE");
    expect(outputVal).toContain("db_table = 'categories'");
    expect(outputVal).toContain('def __str__(self):');
    expect(outputVal).toContain('# admin.py');
    expect(outputVal).toContain('@admin.register(Category)');
  });

  test('handles option toggles correctly', async ({ page }) => {
    await page.getByRole('button', { name: /E-Commerce/i }).first().click();

    // Toggle off admin code
    await page.locator('#generate-admin').uncheck();
    let outputVal = await page.locator('#django-output').inputValue();
    expect(outputVal).not.toContain('# admin.py');

    // Toggle off Meta class
    await page.locator('#generate-meta').uncheck();
    outputVal = await page.locator('#django-output').inputValue();
    expect(outputVal).not.toContain('class Meta:');

    // Change field casing to camelCase
    await page.locator('#django-field-casing').selectOption('camelCase');
    outputVal = await page.locator('#django-output').inputValue();
    expect(outputVal).toContain('isActive = models.BooleanField');
  });

  test('handles clear button and restores focus to input', async ({ page }) => {
    await page.getByRole('button', { name: /User Auth|Authentification/i }).first().click();
    expect(await page.locator('#django-output').inputValue()).not.toBe('');

    await page.getByRole('button', { name: /Clear|Effacer/i }).first().click();

    expect(await page.locator('#sql-django-input').inputValue()).toBe('');
    expect(await page.locator('#django-output').inputValue()).toBe('');
    await expect(page.locator('#sql-django-input')).toBeFocused();
  });

  test('supports Escape shortcut key to clear', async ({ page }) => {
    await page.getByRole('button', { name: /Blog/i }).first().click();
    expect(await page.locator('#django-output').inputValue()).not.toBe('');

    // Focus input and press Escape
    await page.locator('#sql-django-input').focus();
    await page.keyboard.press('Escape');

    expect(await page.locator('#sql-django-input').inputValue()).toBe('');
    expect(await page.locator('#django-output').inputValue()).toBe('');
    await expect(page.locator('#sql-django-input')).toBeFocused();
  });
});
