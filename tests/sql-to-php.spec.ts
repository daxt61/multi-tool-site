import { test, expect } from '@playwright/test';

test.describe('SQL DDL to PHP & JSON to PHP Tools', () => {
  test('SQL to PHP tool renders and converts SQL CREATE TABLE into PHP classes', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-php');

    // Page title and heading
    await expect(page.locator('h1')).toContainText('SQL DDL en PHP');

    // Input and output labels
    const inputLabel = page.locator('label[for="sql-php-input"]');
    const outputLabel = page.locator('label[for="php-output"]');
    await expect(inputLabel).toBeVisible();
    await expect(outputLabel).toBeVisible();

    // Default PHP output should contain PHP 8.2 Readonly Class
    const outputArea = page.locator('#php-output');
    await expect(outputArea).toContainText('readonly class Products');
    await expect(outputArea).toContainText('public ?int $id = null');
    await expect(outputArea).toContainText('public string $sku');
    await expect(outputArea).toContainText('public float $price');

    // Switch Target Mode to Laravel Eloquent
    await page.locator('#target-mode-select').selectOption('eloquent');
    await expect(outputArea).toContainText('class Products extends Model');
    await expect(outputArea).toContainText("protected $table = 'products';");

    // Click Preset: User Auth & Roles
    await page.click('button:has-text("Authentification & Rôles")');
    await expect(outputArea).toContainText('class Users extends Model');
    await expect(outputArea).toContainText("protected $table = 'users';");

    // Switch Target Mode to Standard Class DTO and change casing to camelCase
    await page.locator('#target-mode-select').selectOption('class_dto');
    await page.locator('#property-casing-select').selectOption('camelCase');
    await expect(outputArea).toContainText('class Users');
    await expect(outputArea).toContainText('$passwordHash');

    // Test Clear button and focus restoration
    await page.click('button:has-text("Effacer")');
    await expect(page.locator('#sql-php-input')).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(page.locator('#sql-php-input')).toBeFocused();
  });

  test('JSON to PHP tool renders and converts JSON into PHP classes', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/json-to-php');

    // Output area check
    const outputArea = page.locator('#php-output');
    await expect(outputArea).toContainText('class RootObject');
    await expect(outputArea).toContainText('public int $id');
    await expect(outputArea).toContainText('public string $username');

    // Click Preset: E-Commerce Order
    await page.click('button:has-text("Commande E-Commerce")');
    await expect(outputArea).toContainText('class RootObject');
    await expect(outputArea).toContainText('public string $order_id');
    await expect(outputArea).toContainText('public float $total_amount');

    // Test Clear button and focus restoration
    await page.click('button:has-text("Effacer")');
    await expect(page.locator('#json-php-input')).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(page.locator('#json-php-input')).toBeFocused();
  });
});
