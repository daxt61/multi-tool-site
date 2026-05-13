import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Tool Updates and State Sharing', () => {

  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('URLEncoder state sharing', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/url-encoder`);
    await page.fill('#url-decoded', 'Hello World!');

    // Use the "Partager config" button in the ToolView header
    await page.click('button:has-text("Partager config")');

    // Get the URL from clipboard
    const urlWithData = await page.evaluate(() => navigator.clipboard.readText());
    expect(urlWithData).toContain('data=');

    // Open the tool with shared state
    await page.goto(urlWithData);
    await expect(page.locator('#url-decoded')).toHaveValue('Hello World!');
    await expect(page.locator('#url-encoded')).toHaveValue('Hello%20World!');
  });

  test('UUIDGenerator state sharing', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/uuid-generator`);
    await page.fill('#uuid-count', '5');
    await page.click('button:has-text("Générer")');

    // Wait for UUIDs to be generated
    await page.waitForSelector('code');
    const uuidCount = await page.locator('code').count();
    expect(uuidCount).toBe(5);

    await page.click('button:has-text("Partager config")');
    const urlWithData = await page.evaluate(() => navigator.clipboard.readText());

    await page.goto(urlWithData);
    await expect(page.locator('#uuid-count')).toHaveValue('5');
    // UUIDs should be restored from state
    await page.waitForSelector('code');
    const restoredUuidCount = await page.locator('code').count();
    expect(restoredUuidCount).toBe(5);
  });

  test('JWTDecoder state sharing', async ({ page }) => {
    const dummyJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await page.goto(`${BASE_URL}/fr/outil/jwt-decoder`);
    await page.fill('#jwt-input', dummyJwt);

    await expect(page.locator('text=John Doe')).toBeVisible();

    await page.click('button:has-text("Partager config")');
    const urlWithData = await page.evaluate(() => navigator.clipboard.readText());

    await page.goto(urlWithData);
    await expect(page.locator('#jwt-input')).toHaveValue(dummyJwt);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('YAMLJSONConverter state sharing', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/yaml-json`);
    const yamlInput = 'foo: bar\nbaz: 123';
    await page.fill('#yaml-input', yamlInput);

    // Wait for auto-conversion
    await expect(page.locator('#json-input')).toContainText('"foo": "bar"');

    await page.click('button:has-text("Partager config")');
    const urlWithData = await page.evaluate(() => navigator.clipboard.readText());

    await page.goto(urlWithData);
    await expect(page.locator('#yaml-input')).toHaveValue(yamlInput);
    await expect(page.locator('#json-input')).toContainText('"baz": 123');
  });

  test('HTTPStatusCodes state sharing', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/http-status`);
    await page.fill('#status-search', '404');

    await expect(page.locator('text=Not Found')).toBeVisible();
    await expect(page.locator('text=OK')).not.toBeVisible();

    await page.click('button:has-text("Partager config")');
    const urlWithData = await page.evaluate(() => navigator.clipboard.readText());

    await page.goto(urlWithData);
    await expect(page.locator('#status-search')).toHaveValue('404');
    await expect(page.locator('text=Not Found')).toBeVisible();
  });

  test('Standardized UI check (Copy buttons)', async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/outil/url-encoder`);
    await page.fill('#url-decoded', 'Test');

    // Select the button that starts with "Copier"
    const copyBtn = page.locator('button:has-text("Copier")').first();
    await copyBtn.click();

    // After click, it should have "Copié"
    await expect(page.locator('button:has-text("Copié")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Copié")').first()).toHaveClass(/bg-emerald-50/);
  });
});
