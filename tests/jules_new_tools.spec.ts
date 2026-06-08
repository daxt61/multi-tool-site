import { test, expect } from '@playwright/test';

test.describe('My New and Enhanced Tools', () => {
  test('List to JSON should be accessible and functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-to-json');
    await expect(page.locator('h1')).toContainText('List to JSON');

    const input = page.locator('textarea').first();
    await input.fill('item1\nitem2\nitem1');

    // Check unique only option
    await page.getByText('Unique Only').click();

    const output = page.locator('textarea').last();
    const outputValue = await output.inputValue();
    expect(outputValue).toContain('item1');
    expect(outputValue).toContain('item2');
    const matches = outputValue.match(/item1/g);
    expect(matches?.length).toBe(1);
  });

  test('Base64 to File should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/base64-to-file');
    await expect(page.locator('h1')).toContainText('Base64 to File');
    await expect(page.getByLabel('Filename')).toBeVisible();
  });

  test('Percentage Calculator should have Escape shortcut hint', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/percentage');
    await expect(page.getByText('Esc')).toBeVisible();
  });

  test('Base64 Tool should have download buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/base64');
    const downloadButtons = page.locator('button[title="Download"]');
    await expect(downloadButtons).toHaveCount(2);
  });

  test('Code Minifier should have Escape shortcut hint', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/code-minifier');
    await expect(page.getByText('Esc')).toBeVisible();
  });
});
