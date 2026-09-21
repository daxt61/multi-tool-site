import { test, expect } from '@playwright/test';

test.describe('Upgraded JSON to Ruby Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-ruby');
  });

  test('renders input/output textareas, options, and preset buttons', async ({ page }) => {
    await expect(page.locator('#json-ruby-input')).toBeVisible();
    await expect(page.locator('#ruby-output')).toBeVisible();
    await expect(page.locator('#ruby-construct')).toBeVisible();
    await expect(page.getByRole('button', { name: /Profil Utilisateur|User Profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Commande E-Commerce|E-Commerce Order/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Configuration API|API Config/i })).toBeVisible();
  });

  test('loads preset and generates Ruby classes correctly', async ({ page }) => {
    await page.getByRole('button', { name: /Profil Utilisateur|User Profile/i }).click();

    const inputVal = await page.locator('#json-ruby-input').inputValue();
    expect(inputVal).toContain('alex_ruby');

    const outputVal = await page.locator('#ruby-output').inputValue();
    expect(outputVal).toContain('class RootObject');
    expect(outputVal).toContain('attr_accessor :id, :username, :email, :is_admin, :roles, :created_at');
    expect(outputVal).toContain('def initialize(id:, username:, email:, is_admin:, roles:, created_at:)');
    expect(outputVal).toContain('@id = id');
  });

  test('updates generated code when construct style is changed', async ({ page }) => {
    await page.getByRole('button', { name: /Commande E-Commerce|E-Commerce Order/i }).click();

    // Change construct style to Data.define
    await page.locator('#ruby-construct').selectOption('data');
    let outputVal = await page.locator('#ruby-output').inputValue();
    expect(outputVal).toContain('RootObject = Data.define(:order_id, :total_amount, :currency, :items, :shipping)');
    expect(outputVal).toContain('Items = Data.define(:item_id, :name, :quantity, :price)');

    // Change construct style to Struct
    await page.locator('#ruby-construct').selectOption('struct');
    outputVal = await page.locator('#ruby-output').inputValue();
    expect(outputVal).toContain('RootObject = Struct.new(:order_id, :total_amount, :currency, :items, :shipping, keyword_init: true)');
  });

  test('handles Ruby reserved keyword property names safely', async ({ page }) => {
    await page.locator('#json-ruby-input').fill(JSON.stringify({
      class: 'Physics 101',
      def: 'function_name',
      if: true,
      while: 10
    }, null, 2));

    const outputVal = await page.locator('#ruby-output').inputValue();
    expect(outputVal).toContain(':class_');
    expect(outputVal).toContain(':def_');
    expect(outputVal).toContain(':if_');
    expect(outputVal).toContain(':while_');
  });

  test('clears input with clear button and restores focus to input', async ({ page }) => {
    await page.getByRole('button', { name: /Profil Utilisateur|User Profile/i }).click();

    await page.getByRole('button', { name: /Effacer|Clear/i }).click();

    expect(await page.locator('#json-ruby-input').inputValue()).toBe('');
    expect(await page.locator('#ruby-output').inputValue()).toBe('');
    await expect(page.locator('#json-ruby-input')).toBeFocused();
  });
});
