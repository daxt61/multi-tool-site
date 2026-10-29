import { test, expect } from '@playwright/test';

test.describe('GraphQL to Julia Converter UX & Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tool=graphql-to-julia');
  });

  test('renders tool components and title correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('GraphQL to Julia Converter');
    await expect(page.locator('#graphql-julia-input')).toBeVisible();
    await expect(page.locator('#julia-output')).toBeVisible();
  });

  test('loads quick preset and converts GraphQL SDL into Julia structs', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

    const outputTextarea = page.locator('#julia-output');
    await expect(outputTextarea).not.toHaveValue('');

    const outputVal = await outputTextarea.inputValue();
    expect(outputVal).toContain('module GraphQLModels');
    expect(outputVal).toContain('struct Product');
    expect(outputVal).toContain('id::String');
    expect(outputVal).toContain('price::Float64');
    expect(outputVal).toContain('StructTypes.StructType(::Type{Product}) = StructTypes.Struct()');
  });

  test('clears preset aria-pressed when user manually edits input', async ({ page }) => {
    const presetBtn = page.getByRole('button', { name: 'User Management & Auth' });
    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

    const inputArea = page.locator('#graphql-julia-input');
    await inputArea.focus();
    await page.keyboard.type('\n# custom comment');

    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('supports changing struct kind and package serialization style', async ({ page }) => {
    await page.getByRole('button', { name: 'E-Commerce Catalog' }).click();

    // Select mutable struct
    const structKindSelect = page.locator('select').first();
    await structKindSelect.selectOption('mutable struct');

    const outputTextarea = page.locator('#julia-output');
    await expect(outputTextarea).toContainText('mutable struct Product');

    // Select JSON3.jl style
    const pkgSelect = page.locator('select').nth(1);
    await pkgSelect.selectOption('json3');

    await expect(outputTextarea).toContainText('using JSON3');
    await expect(outputTextarea).toContainText('JSON3.StructType(::Type{Product}) = JSON3.Struct()');
  });
});
