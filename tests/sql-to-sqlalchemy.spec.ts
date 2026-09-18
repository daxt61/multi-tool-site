import { test, expect } from '@playwright/test';

test.describe('SQL DDL to SQLAlchemy ORM Models Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-sqlalchemy');
  });

  test('renders tool title and options correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#sql-sqlalchemy-input')).toBeVisible();
    await expect(page.locator('#sqlalchemy-output')).toBeVisible();
    await expect(page.locator('#alchemy-syntax-version')).toHaveValue('2.0');
  });

  test('loads quick preset and generates SQLAlchemy 2.0 models', async ({ page }) => {
    // Click E-Commerce Catalog preset
    await page.getByRole('button', { name: /E-Commerce/i }).first().click();

    const inputVal = await page.locator('#sql-sqlalchemy-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE categories');
    expect(inputVal).toContain('CREATE TABLE products');

    const outputVal = await page.locator('#sqlalchemy-output').inputValue();
    expect(outputVal).toContain('from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column');
    expect(outputVal).toContain('class Product(Base):');
    expect(outputVal).toContain('__tablename__ = "categories"');
    expect(outputVal).toContain('Mapped[');
    expect(outputVal).toContain('mapped_column(');
    expect(outputVal).toContain('def __repr__(self)');
  });

  test('switches to SQLAlchemy 1.4 Column syntax', async ({ page }) => {
    await page.getByRole('button', { name: /E-Commerce/i }).first().click();

    // Change syntax version to 1.4
    await page.locator('#alchemy-syntax-version').selectOption('1.4');

    const outputVal = await page.locator('#sqlalchemy-output').inputValue();
    expect(outputVal).toContain('from sqlalchemy.orm import declarative_base');
    expect(outputVal).toContain('from sqlalchemy import Column');
    expect(outputVal).toContain('Column(Integer, primary_key=True)');
  });

  test('handles clear button and restores focus to input', async ({ page }) => {
    await page.getByRole('button', { name: /User Auth|Authentification/i }).first().click();
    expect(await page.locator('#sqlalchemy-output').inputValue()).not.toBe('');

    await page.getByRole('button', { name: /Clear|Effacer/i }).first().click();

    expect(await page.locator('#sql-sqlalchemy-input').inputValue()).toBe('');
    expect(await page.locator('#sqlalchemy-output').inputValue()).toBe('');
    await expect(page.locator('#sql-sqlalchemy-input')).toBeFocused();
  });

  test('supports Escape shortcut key to clear', async ({ page }) => {
    await page.getByRole('button', { name: /Blog/i }).first().click();
    expect(await page.locator('#sqlalchemy-output').inputValue()).not.toBe('');

    // Focus input and press Escape
    await page.locator('#sql-sqlalchemy-input').focus();
    await page.keyboard.press('Escape');

    expect(await page.locator('#sql-sqlalchemy-input').inputValue()).toBe('');
    expect(await page.locator('#sqlalchemy-output').inputValue()).toBe('');
    await expect(page.locator('#sql-sqlalchemy-input')).toBeFocused();
  });
});
