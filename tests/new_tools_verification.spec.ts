import { test, expect } from '@playwright/test';

test('Verify JSON to GraphQL', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-to-graphql');
  await page.fill('#json-input', '{"id": 1, "name": "John"}');
  const output = page.locator('pre');
  await expect(output).toContainText('type Root {');
  await expect(output).toContainText('id: Int');
  await expect(output).toContainText('name: String');
});

test('Verify JSON to Mongoose', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-to-mongoose');
  await page.fill('#json-input-mongoose', '{"title": "Test", "active": true}');
  const output = page.locator('pre');
  await expect(output).toContainText('const RootSchema = new mongoose.Schema({');
  await expect(output).toContainText('title: String');
  await expect(output).toContainText('active: Boolean');
});

test('Verify HTML to Markdown', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/html-to-markdown');
  await page.fill('#html-input-md', '<h1>Title</h1><p>Text</p>');
  const output = page.locator('pre');
  await expect(output).toContainText('# Title');
  await expect(output).toContainText('Text');
});

test('Verify List Cleaner upgrades', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/list-cleaner');
  await page.fill('#list-input', 'item1\nitem2');
  await page.click('button:has-text("Ajouter numéros de ligne")');
  const input = page.locator('#list-input');
  await expect(input).toHaveValue('1. item1\n2. item2');
});
