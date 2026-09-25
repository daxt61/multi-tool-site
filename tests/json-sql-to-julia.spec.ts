import { test, expect } from '@playwright/test';

test.describe('JSON to Julia Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-julia');
  });

  test('renders input/output textareas and preset buttons', async ({ page }) => {
    await expect(page.locator('#json-julia-input')).toBeVisible();
    await expect(page.locator('#julia-output')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sensor Telemetry/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /User Profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /E-Commerce Order/i })).toBeVisible();
  });

  test('loads preset and generates Julia struct definitions', async ({ page }) => {
    await page.getByRole('button', { name: /Sensor Telemetry/i }).click();

    const inputVal = await page.locator('#json-julia-input').inputValue();
    expect(inputVal).toContain('sensor_id');

    const outputVal = await page.locator('#julia-output').inputValue();
    expect(outputVal).toContain('struct RootModel');
    expect(outputVal).toContain('sensor_id::String');
    expect(outputVal).toContain('StructTypes.StructType');
  });

  test('clears input on Escape key press and restores focus', async ({ page }) => {
    await page.getByRole('button', { name: /User Profile/i }).click();
    await expect(page.locator('#julia-output')).not.toHaveValue('');

    await page.locator('body').click();
    await page.keyboard.press('Escape');

    await expect(page.locator('#json-julia-input')).toHaveValue('');
    await expect(page.locator('#julia-output')).toHaveValue('');
    await expect(page.locator('#json-julia-input')).toBeFocused();
  });
});

test.describe('SQL DDL to Julia Struct Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-julia');
  });

  test('renders input/output textareas and preset buttons', async ({ page }) => {
    await expect(page.locator('#sql-julia-input')).toBeVisible();
    await expect(page.locator('#julia-output')).toBeVisible();
    await expect(page.getByRole('button', { name: /E-Commerce Catalog/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /User Auth & Roles/i })).toBeVisible();
  });

  test('loads SQL preset and generates Julia structs', async ({ page }) => {
    await page.getByRole('button', { name: /E-Commerce Catalog/i }).click();

    const inputVal = await page.locator('#sql-julia-input').inputValue();
    expect(inputVal).toContain('CREATE TABLE products');

    const outputVal = await page.locator('#julia-output').inputValue();
    expect(outputVal).toContain('struct Products');
    expect(outputVal).toContain('product_id::Int64');
    expect(outputVal).toContain('StructTypes.StructType');
  });

  test('clears SQL input on Escape key press and restores focus', async ({ page }) => {
    await page.getByRole('button', { name: /User Auth & Roles/i }).click();
    await expect(page.locator('#julia-output')).not.toHaveValue('');

    await page.locator('body').click();
    await page.keyboard.press('Escape');

    await expect(page.locator('#sql-julia-input')).toHaveValue('');
    await expect(page.locator('#julia-output')).toHaveValue('');
    await expect(page.locator('#sql-julia-input')).toBeFocused();
  });
});
