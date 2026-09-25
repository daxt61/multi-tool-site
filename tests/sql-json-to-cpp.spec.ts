import { test, expect } from '@playwright/test';

test.describe('SQLToCPP and JSONToCPP Tools', () => {
  test('SQLToCPP converts SQL CREATE TABLE DDL to C++ structs and handles options and presets', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sql-to-cpp');

    // Verify initial layout
    await expect(page.locator('#sql-cpp-input')).toBeVisible();
    await expect(page.locator('#cpp-output')).toBeVisible();

    // Load E-Commerce Catalog preset
    await page.getByRole('button', { name: 'E-Commerce Catalog' }).click();
    const inputContent = await page.inputValue('#sql-cpp-input');
    expect(inputContent).toContain('CREATE TABLE categories');
    expect(inputContent).toContain('CREATE TABLE products');

    // Verify output contains struct definitions
    const outputContent = await page.inputValue('#cpp-output');
    expect(outputContent).toContain('struct Categories {');
    expect(outputContent).toContain('int32_t category_id;');
    expect(outputContent).toContain('std::string name;');
    expect(outputContent).toContain('std::optional<std::string> description;');
    expect(outputContent).toContain('struct Products {');
    expect(outputContent).toContain('double price;');

    // Change construct to class
    await page.selectOption('#cpp-construct-kind', 'class');
    const classOutput = await page.inputValue('#cpp-output');
    expect(classOutput).toContain('class Categories {');
    expect(classOutput).toContain('public:');

    // Toggle nlohmann::json macros
    await page.check('#use-nlohmann-json');
    const jsonOutput = await page.inputValue('#cpp-output');
    expect(jsonOutput).toContain('#include <nlohmann/json.hpp>');
    expect(jsonOutput).toContain('NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Categories');

    // Test Namespace option
    await page.fill('#cpp-namespace', 'ecommerce::db');
    const nsOutput = await page.inputValue('#cpp-output');
    expect(nsOutput).toContain('namespace ecommerce::db {');
    expect(nsOutput).toContain('} // namespace ecommerce::db');

    // Test Esc shortcut
    await page.locator('#sql-cpp-input').focus();
    await page.keyboard.press('Escape');
    expect(await page.inputValue('#sql-cpp-input')).toBe('');
    expect(await page.inputValue('#cpp-output')).toBe('');
  });

  test('JSONToCPP converts JSON payload to C++ structs/classes and handles presets and shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-cpp');

    // Verify initial layout
    await expect(page.locator('#json-cpp-input')).toBeVisible();
    await expect(page.locator('#cpp-output')).toBeVisible();

    // Load User Profile preset
    await page.getByRole('button', { name: 'User Profile' }).click();
    const inputContent = await page.inputValue('#json-cpp-input');
    expect(inputContent).toContain('johndoe');

    // Verify output C++ structs
    const outputContent = await page.inputValue('#cpp-output');
    expect(outputContent).toContain('struct Address {');
    expect(outputContent).toContain('struct RootObject {');
    expect(outputContent).toContain('std::string username;');
    expect(outputContent).toContain('double score;');
    expect(outputContent).toContain('std::vector<std::string> tags;');

    // Test Casing change
    await page.selectOption('#json-cpp-casing', 'camelCase');
    const camelOutput = await page.inputValue('#cpp-output');
    expect(camelOutput).toContain('bool isActive;');

    // Test clear action
    await page.getByRole('button', { name: 'Clear' }).click();
    expect(await page.inputValue('#json-cpp-input')).toBe('');
    expect(await page.inputValue('#cpp-output')).toBe('');
  });
});
