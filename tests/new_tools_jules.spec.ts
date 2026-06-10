import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('New Tools Smoke Test', () => {
  test('JWT Generator should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/jwt-generator`);
    await expect(page.locator('h1')).toContainText('JWT Generator');
    await expect(page.locator('textarea#jwt-header')).toBeVisible();
    await expect(page.locator('textarea#jwt-payload')).toBeVisible();
  });

  test('FIRE Calculator should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/fire-calculator`);
    await expect(page.locator('h1')).toContainText('FIRE Calculator');
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('Mock Data Generator should have new features', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/mock-data`);
    await expect(page.locator('h1')).toContainText('Mock Data');
    await page.click('button:has-text("English")');
    await page.click('button:has-text("Generate")');
    const output = await page.locator('textarea').inputValue();
    expect(output).toContain('firstName');
    expect(output).toContain('jobTitle');
  });

  test('JSON to TS should detect dates', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/outil/json-to-ts`);
    const input = JSON.stringify({ createdAt: '2023-01-01T10:00:00Z' });
    await page.fill('textarea#json-input', input);
    await expect(page.locator('textarea#ts-output')).toContainText('createdAt: Date;');
  });
});
