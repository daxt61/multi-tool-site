import { test, expect } from '@playwright/test';

test.describe('GraphQL to PHP Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/graphql-to-php');
    await page.waitForSelector('#graphql-php-input');
  });

  test('converts GraphQL SDL schema to PHP 8.2 readonly DTOs by default', async ({ page }) => {
    const inputArea = page.locator('#graphql-php-input');
    const outputArea = page.locator('#php-output');

    await inputArea.fill(`
      type Product {
        id: ID!
        title: String!
        price: Float!
        isAvailable: Boolean
      }
    `);

    await expect(outputArea).toHaveValue(/declare\(strict_types=1\);/);
    await expect(outputArea).toHaveValue(/namespace App\\DTO;/);
    await expect(outputArea).toHaveValue(/readonly class Product/);
    await expect(outputArea).toHaveValue(/public string \$id/);
    await expect(outputArea).toHaveValue(/public string \$title/);
    await expect(outputArea).toHaveValue(/public float \$price/);
    await expect(outputArea).toHaveValue(/public \?bool \$isAvailable = null/);
  });

  test('switches output format to PHP 8.1+ Class and Spatie Data DTO', async ({ page }) => {
    const inputArea = page.locator('#graphql-php-input');
    const outputArea = page.locator('#php-output');
    const formatSelect = page.locator('#php-output-format');

    await inputArea.fill(`
      type User {
        id: ID!
        email: String!
      }
    `);

    // Switch to PHP 8.1 Class
    await formatSelect.selectOption('php81_class');
    await expect(outputArea).toHaveValue(/class User/);
    await expect(outputArea).toHaveValue(/public string \$id;/);
    await expect(outputArea).toHaveValue(/\$this->id = \$id;/);

    // Switch to Spatie / Laravel Data DTO
    await formatSelect.selectOption('spatie_dto');
    await expect(outputArea).toHaveValue(/use Spatie\\LaravelData\\Data;/);
    await expect(outputArea).toHaveValue(/class User extends Data/);
  });

  test('applies property casing transformations and custom namespace', async ({ page }) => {
    const inputArea = page.locator('#graphql-php-input');
    const outputArea = page.locator('#php-output');
    const casingSelect = page.locator('#php-property-casing');
    const namespaceInput = page.locator('#php-namespace');

    await inputArea.fill(`
      type Order {
        id: ID!
        customerName: String!
      }
    `);

    // Custom namespace
    await namespaceInput.fill('Domain\\Orders\\DTO');

    // snake_case
    await casingSelect.selectOption('snake_case');
    await expect(outputArea).toHaveValue(/namespace Domain\\Orders\\DTO;/);
    await expect(outputArea).toHaveValue(/public string \$customer_name/);

    // PascalCase
    await casingSelect.selectOption('PascalCase');
    await expect(outputArea).toHaveValue(/public string \$CustomerName/);
  });

  test('loads quick start presets and tracks active state via aria-pressed', async ({ page }) => {
    const outputArea = page.locator('#php-output');
    const presetEcomBtn = page.getByRole('button', { name: 'E-Commerce Catalog' });

    await presetEcomBtn.click();
    await expect(presetEcomBtn).toHaveAttribute('aria-pressed', 'true');

    await expect(outputArea).toHaveValue(/readonly class Category/);
    await expect(outputArea).toHaveValue(/readonly class Product/);
    await expect(outputArea).toHaveValue(/enum OrderStatus: string/);
  });

  test('sanitizes PHP reserved keywords and namespace breakout attempts', async ({ page }) => {
    const inputArea = page.locator('#graphql-php-input');
    const outputArea = page.locator('#php-output');
    const namespaceInput = page.locator('#php-namespace');

    // Attempt namespace breakout injection
    await namespaceInput.fill('App\\DTO; ?> <?php echo "hack";');

    await inputArea.fill(`
      type Item {
        class: String!
        function: String
      }
    `);

    const outputText = await outputArea.inputValue();
    expect(outputText).not.toContain('?>');
    expect(outputText).toContain('namespace App\\DTOphpechohack;');
    expect(outputText).toContain('public string $classVal');
    expect(outputText).toContain('public ?string $functionVal = null');
  });

  test('clears input with Escape key and focus restoration', async ({ page }) => {
    const inputArea = page.locator('#graphql-php-input');
    const outputArea = page.locator('#php-output');

    await inputArea.fill('type Test { id: ID! }');
    await expect(outputArea).not.toHaveValue('');

    // Focus outside and hit Escape
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });
});
