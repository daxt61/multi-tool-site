import { test, expect } from '@playwright/test';

test('verify Neumorphism Generator', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/neumorphism-generator');
  await expect(page.getByRole('heading', { name: 'Neumorphism', exact: true })).toBeVisible();
  await expect(page.getByText('CSS Code')).toBeVisible();
});

test('verify JSON to ENV', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-to-env');
  await expect(page.getByText('JSON en ENV')).toBeVisible();
  await page.fill('#json-input', '{"API_KEY": "12345"}');
  await expect(page.locator('#env-output')).toHaveValue(/API_KEY=12345/);
});

test('verify Word Counter updates', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/word-counter');
  await page.fill('#word-counter-input', 'Ceci est un test avec des mots complexes comme anticonstitutionnellement.');
  await expect(page.getByText('Gunning Fog').first()).toBeVisible();
  // Use exact match to avoid strict mode violation with the textarea content
  await expect(page.getByText('anticonstitutionnellement', { exact: true })).toBeVisible();
});

test('verify Markdown Table Generator updates', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/markdown-table');
  await expect(page.getByTitle('Aligner au centre').first()).toBeVisible();
});
