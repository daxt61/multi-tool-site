import { test, expect } from '@playwright/test';

test.describe('GraphQL to Mermaid & SQL to Elixir Converters', () => {
  test('GraphQL to Mermaid converts GraphQL SDL to Mermaid classDiagram and erDiagram syntax', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-mermaid');

    const input = page.locator('#graphql-mermaid-input');
    const output = page.locator('#mermaid-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    // Verify loading preset
    const ecommercePresetBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });
    await expect(ecommercePresetBtn).toBeVisible();
    await ecommercePresetBtn.click();

    await expect(output).toContainText('classDiagram');
    await expect(output).toContainText('class Product');
    await expect(output).toContainText('class Category');
    await expect(output).toContainText('Product --> "*" Review : reviews');

    // Switch diagram type to erDiagram
    const diagramTypeSelect = page.locator('#mermaid-diagram-type');
    await diagramTypeSelect.selectOption('erDiagram');

    await expect(output).toContainText('erDiagram');
    await expect(output).toContainText('Product {');
    await expect(output).toContainText('Category {');

    // Clear input via Escape key shortcut
    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('SQL to Elixir converts SQL CREATE TABLE DDL into Elixir Ecto schemas', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-elixir');

    const input = page.locator('#sql-elixir-input');
    const output = page.locator('#sql-elixir-output');

    await expect(input).toBeVisible();
    await expect(output).toBeVisible();

    // Load user auth preset
    const userAuthPresetBtn = page.getByRole('button', { name: 'User Auth & Roles' });
    await expect(userAuthPresetBtn).toBeVisible();
    await userAuthPresetBtn.click();

    await expect(output).toContainText('defmodule MyApp.User do');
    await expect(output).toContainText('use Ecto.Schema');
    await expect(output).toContainText('schema "users" do');
    await expect(output).toContainText('field :email, :string');
    await expect(output).toContainText('def changeset(user, attrs) do');

    // Toggle UUID Binary IDs
    const binaryIdCheckbox = page.locator('#use-binary-id');
    await binaryIdCheckbox.check();

    await expect(output).toContainText('@primary_key {:id, :binary_id, autogenerate: true}');

    // Clear input
    const clearBtn = page.getByRole('button', { name: 'Clear' });
    await clearBtn.click();

    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });
});
