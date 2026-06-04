import { test, expect } from '@playwright/test';

const TOOLS = [
  { id: 'hex-to-image', name: 'Hex en Image' },
  { id: 'fractal-tree', name: 'Arbre Fractal' },
  { id: 'unicode-normalizer', name: 'Normaliseur Unicode' },
  { id: 'integer-pair-generator', name: 'Paires d\'Entiers' },
  { id: 'binary-reverser', name: 'Inverseur Binaire' },
];

test.describe('New Inspired Tools Smoke Test', () => {
  for (const tool of TOOLS) {
    test(`should load ${tool.name} correctly`, async ({ page }) => {
      await page.goto(`http://localhost:5173/fr/outil/${tool.id}`);
      await expect(page.locator('h1')).toContainText(tool.name);

      // Basic check for one key element in each tool
      if (tool.id === 'hex-to-image') {
        await expect(page.locator('textarea#hex-input')).toBeVisible();
      } else if (tool.id === 'fractal-tree') {
        await expect(page.locator('canvas')).toBeVisible();
      } else if (tool.id === 'unicode-normalizer') {
        await expect(page.locator('textarea#norm-input')).toBeVisible();
      } else if (tool.id === 'integer-pair-generator') {
        await expect(page.locator('button', { hasText: /Générer/i })).toBeVisible();
      } else if (tool.id === 'binary-reverser') {
        await expect(page.locator('textarea#bin-input')).toBeVisible();
      }
    });
  }
});
