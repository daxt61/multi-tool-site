import { test, expect } from '@playwright/test';

test.describe('SQL to Redis Commands Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-redis');
  });

  test('renders tool title and elements correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SQL en Commandes Redis');
    await expect(page.locator('#sql-redis-input')).toBeVisible();
    await expect(page.locator('#redis-output')).toBeVisible();
  });

  test('converts default preset (E-Commerce Catalog Hash) correctly', async ({ page }) => {
    const output = page.locator('#redis-output');
    await expect(output).toContainText('HSET products:101');
    await expect(output).toContainText('HMGET products:101 title price stock_quantity');
  });

  test('switches structure to RedisJSON and generates JSON.SET and JSON.GET', async ({ page }) => {
    await page.selectOption('#sql-redis-structure', 'json');
    const output = page.locator('#redis-output');
    await expect(output).toContainText('JSON.SET products:101 $');
    await expect(output).toContainText('JSON.GET products:101 $.title $.price $.stock_quantity');
  });

  test('switches structure to Key-Value String and generates SET and GET', async ({ page }) => {
    await page.selectOption('#sql-redis-structure', 'string');
    const output = page.locator('#redis-output');
    await expect(output).toContainText('SET products:101');
    await expect(output).toContainText('GET products:101');
  });

  test('handles TTL expiration option', async ({ page }) => {
    await page.fill('#sql-redis-ttl', '3600');
    const output = page.locator('#redis-output');
    await expect(output).toContainText('EXPIRE products:101 3600');
  });

  test('switches key separator and command casing', async ({ page }) => {
    await page.selectOption('#sql-redis-separator', '_');
    await page.selectOption('#sql-redis-casing', 'lowercase');

    const output = page.locator('#redis-output');
    await expect(output).toContainText('hset products_101');
    await expect(output).toContainText('hmget products_101');
  });

  test('applies User Sessions preset correctly', async ({ page }) => {
    await page.click('button:has-text("User Sessions (JSON.SET)")');
    const input = page.locator('#sql-redis-input');
    const output = page.locator('#redis-output');

    await expect(input).toContainText('user_sessions');
    await expect(output).toContainText('JSON.SET user_sessions:42 $');
    await expect(output).toContainText('JSON.GET user_sessions:42');
  });

  test('handles clear button and restores focus to input', async ({ page }) => {
    await page.click('button:has-text("Effacer")');
    await expect(page.locator('#sql-redis-input')).toHaveValue('');
    await expect(page.locator('#redis-output')).toHaveValue('');
    await expect(page.locator('#sql-redis-input')).toBeFocused();
  });

  test('supports Escape keyboard shortcut to clear input', async ({ page }) => {
    await page.focus('#sql-redis-input');
    await page.keyboard.press('Escape');

    await expect(page.locator('#sql-redis-input')).toHaveValue('');
    await expect(page.locator('#redis-output')).toHaveValue('');
  });
});
