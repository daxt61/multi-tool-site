import { test, expect } from '@playwright/test';

test.describe('JSON to Prisma Tool E2E and UX', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the JSON to Prisma tool page in English
    await page.goto('http://localhost:5173/en/outil/json-to-prisma');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page, input elements, and options correctly', async ({ page }) => {
    // Check that title or key labels are visible
    await expect(page.locator('h1')).toContainText('JSON to Prisma');
    await expect(page.locator('label', { hasText: 'Input JSON' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Prisma Schema' })).toBeVisible();

    // Check configuration dropdowns exist
    const providerSelect = page.locator('#db-provider');
    await expect(providerSelect).toBeVisible();
    await expect(providerSelect).toHaveValue('postgresql');

    const idSelect = page.locator('#id-strategy');
    await expect(idSelect).toBeVisible();
    await expect(idSelect).toHaveValue('autoincrement');
  });

  test('should convert a simple JSON object to Prisma model', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    await jsonInput.clear();
    await jsonInput.fill(JSON.stringify({
      id: 42,
      username: "johndoe",
      email: "john@example.com",
      isActive: true
    }));

    const prismaOutput = page.locator('#prisma-output');
    await expect(prismaOutput).toContainText('model Root {');
    await expect(prismaOutput).toContainText('id Int @id @default(autoincrement())');
    await expect(prismaOutput).toContainText('username String');
    await expect(prismaOutput).toContainText('email String');
    await expect(prismaOutput).toContainText('isActive Boolean');
  });

  test('should parse relations, sub-models, and auto back-references', async ({ page, context }) => {
    const jsonInput = page.locator('#json-input');
    await jsonInput.clear();
    await jsonInput.fill(JSON.stringify({
      id: 1,
      email: "user@example.com",
      profile: {
        id: 10,
        fullName: "User Profile"
      },
      posts: [
        {
          id: 101,
          title: "My post"
        }
      ]
    }));

    // Select mysql provider
    await page.selectOption('#db-provider', 'mysql');
    await page.waitForTimeout(500);

    // Select uuid strategy
    await page.selectOption('#id-strategy', 'uuid');
    await page.waitForTimeout(500);

    const prismaOutput = page.locator('#prisma-output');
    await expect(prismaOutput).toContainText('model Root {');
    await expect(prismaOutput).toContainText('model Profile {');
    await expect(prismaOutput).toContainText('model Posts {');

    // Verify relation and ID mapping references exist
    await expect(prismaOutput).toContainText('profile Profile @relation');
    await expect(prismaOutput).toContainText('posts Posts[]');

    // Take verification screenshot
    await page.screenshot({ path: '/home/jules/verification/screenshots/verification.png' });
    await page.waitForTimeout(1000);
  });

  test('should handle keyboard shortcuts correctly', async ({ page }) => {
    const jsonInput = page.locator('#json-input');
    await jsonInput.fill('{"a": 1}');

    // Press Escape to clear when focused on input
    await jsonInput.focus();
    await page.keyboard.press('Escape');
    await expect(jsonInput).toHaveValue('');

    // Fill again
    await jsonInput.fill('{"test": true}');
    await jsonInput.blur(); // Blur to allow global shortcut 'C' for copy

    // Press 'c' to copy the schema
    await page.keyboard.press('c');

    // Copy confirmation toast or button state should indicate success
    const prismaOutput = page.locator('#prisma-output');
    await expect(prismaOutput).toContainText('model Root {');
    await expect(prismaOutput).toContainText('test Boolean');
  });
});
