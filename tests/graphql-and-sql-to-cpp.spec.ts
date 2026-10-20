import { test, expect } from '@playwright/test';

test.describe('GraphQL & SQL to C++ Converters', () => {
  test('GraphQLToCPP converts GraphQL SDL to C++ structs/classes with presets and options', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/graphql-to-cpp');

    await expect(page.locator('h1')).toContainText('GraphQL en C++');

    const inputArea = page.locator('#graphql-cpp-input');
    const outputArea = page.locator('#cpp-output');

    // Test E-Commerce preset
    const presetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

    await expect(inputArea).toHaveValue(/type Category/);
    await expect(outputArea).toHaveValue(/#include <string>/);
    await expect(outputArea).toHaveValue(/enum class OrderStatus/);
    await expect(outputArea).toHaveValue(/struct Category \{/);
    await expect(outputArea).toHaveValue(/struct Product \{/);
    await expect(outputArea).toHaveValue(/std::optional<std::string> description;/);

    // Test construct kind change to class
    const constructKindSelect = page.locator('#gql-cpp-construct-kind');
    await constructKindSelect.selectOption('class');
    await expect(outputArea).toHaveValue(/class Product \{\npublic:/);

    // Initially snake_case
    await expect(outputArea).toHaveValue(/bool is_active;/);

    // Test casing change to camelCase
    const casingSelect = page.locator('#gql-cpp-casing');
    await casingSelect.selectOption('camelCase');
    await expect(outputArea).toHaveValue(/bool isActive;/);

    // Test nlohmann::json toggle
    const nlohmannCheckbox = page.locator('#gql-cpp-use-nlohmann');
    await nlohmannCheckbox.check();
    await expect(outputArea).toHaveValue(/#include <nlohmann\/json.hpp>/);
    await expect(outputArea).toHaveValue(/NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE\(Product/);

    // Test namespace
    const namespaceInput = page.locator('#gql-cpp-namespace');
    await namespaceInput.fill('my_app::gql');
    await expect(outputArea).toHaveValue(/namespace my_app::gql \{/);

    // Test clearing resets preset selection
    await inputArea.fill('type Simple { id: ID! }');
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('SQLToCPP converts SQL DDL to C++ structs with Palette UX standards', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-cpp');

    await expect(page.locator('h1')).toContainText('SQL DDL en C++');

    const inputArea = page.locator('#sql-cpp-input');
    const outputArea = page.locator('#cpp-output');

    // Test preset button
    const presetBtn = page.getByRole('button', { name: 'Catalogue E-Commerce' });
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
    await presetBtn.click();
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'true');

    await expect(inputArea).toHaveValue(/CREATE TABLE categories/);
    await expect(outputArea).toHaveValue(/struct Categories \{/);
    await expect(outputArea).toHaveValue(/struct Products \{/);
    await expect(outputArea).toHaveValue(/std::optional<std::string> description;/);

    // Editing input clears active preset
    await inputArea.fill('CREATE TABLE test (id INT PRIMARY KEY);');
    await expect(presetBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(outputArea).toHaveValue(/struct Test \{/);
  });
});
