import { test, expect } from '@playwright/test';

test.describe('New Tools Smoke Test', () => {
  const tools = [
    { id: 'soft-shadow', name: 'Soft Shadows' },
    { id: 'json-to-pydantic', name: 'JSON to Pydantic' },
    { id: 'sql-minifier', name: 'SQL Minifier' },
    { id: 'base64-to-audio', name: 'Base64 to Audio' },
  ];

  for (const tool of tools) {
    test(`Tool ${tool.id} should load correctly`, async ({ page }) => {
      await page.goto(`http://localhost:5173/en/outil/${tool.id}`);
      await expect(page.locator('h1')).toContainText(tool.name);
    });
  }
});
