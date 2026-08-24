import { test, expect } from '@playwright/test';

test.describe('JSON to .env Converter Tool Upgrades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/json-to-env');
  });

  test('should render properly and convert JSON to .env format', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('JSON to ENV');

    const jsonInput = page.locator('#json-input');
    await jsonInput.fill(JSON.stringify({
      database: {
        host: "localhost",
        port: 5432
      },
      debug: true
    }));

    const envOutput = page.locator('#env-output');
    await expect(envOutput).toContainText('DATABASE_HOST=localhost');
    await expect(envOutput).toContainText('DATABASE_PORT=5432');
    await expect(envOutput).toContainText('DEBUG=true');
  });

  test('should load interactive presets', async ({ page }) => {
    const fullstackPreset = page.getByRole('button', { name: /Full-Stack/i });
    await fullstackPreset.click();

    const envOutput = page.locator('#env-output');
    await expect(envOutput).toContainText('APP_NAME="My Web Application"');
    await expect(envOutput).toContainText('APP_PORT=3000');
    await expect(envOutput).toContainText('API_KEY=secret_api_key_12345');
  });

  test('should handle options like prefix and quote values', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    await jsonInput.fill(JSON.stringify({
      secret: "my_token"
    }));

    const prefixInput = page.locator('#prefix-input');
    await prefixInput.fill('MYAPP_');

    const envOutput = page.locator('#env-output');
    await expect(envOutput).toContainText('MYAPP_SECRET=my_token');
  });

  test('should handle keyboard shortcuts (Esc to clear)', async ({ page }) => {
    const fullstackPreset = page.getByRole('button', { name: /Full-Stack/i });
    await fullstackPreset.click();

    const envOutput = page.locator('#env-output');
    await expect(envOutput).not.toHaveValue('');

    const jsonInput = page.locator('#json-input');
    await jsonInput.blur();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(jsonInput).toHaveValue('');
    await expect(envOutput).toHaveValue('');
    await expect(jsonInput).toBeFocused();
  });
});
