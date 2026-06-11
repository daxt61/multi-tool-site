import { test, expect } from '@playwright/test';

test.describe('New Tools Smoke Test', () => {
  const tools = [
    'json-flattener',
    'sierpinski-triangle',
    'json-stringifier',
    'html-stripper'
  ];

  for (const tool of tools) {
    test(`should load ${tool}`, async ({ page }) => {
      await page.goto(`http://localhost:5173/en/outil/${tool}`);
      await expect(page.locator('h1')).toBeVisible();
    });
  }
});
