import { test, expect } from '@playwright/test';

test.describe('Added Tools V3 Smoke Tests', () => {
  test('XML to YAML Converter should load and convert', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/xml-to-yaml');
    await expect(page.locator('h1')).toContainText('XML to YAML');

    const xmlInput = '<root><user><id>1</id><name>John</name></user></root>';
    await page.fill('#input-field', xmlInput);
    await page.click('button:has-text("Convert")');

    const output = await page.inputValue('textarea:read-only');
    expect(output).toContain('user:');
    expect(output).toContain('name: John');
  });

  test('YAML to XML Converter should load and convert', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/yaml-to-xml');
    await expect(page.locator('h1')).toContainText('YAML to XML');

    const yamlInput = 'user:\n  id: 1\n  name: John';
    await page.fill('#input-field', yamlInput);
    await page.click('button:has-text("Convert")');

    const output = await page.inputValue('textarea:read-only');
    expect(output).toContain('<user>');
    expect(output).toContain('<name>John</name>');
  });

  test('CSV Transposer should load and transpose', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/csv-transposer');
    await expect(page.locator('h1')).toContainText('CSV Transposer');

    const csvInput = 'id,name\n1,John\n2,Jane';
    await page.fill('#csv-input', csvInput);

    const output = await page.inputValue('#csv-output');
    expect(output).toBe('id,1,2\nname,John,Jane');
  });

  test('Dragon Curve should load and render', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/dragon-curve');
    await expect(page.locator('h1')).toContainText('Dragon Curve');

    const svg = page.locator('#dragon-svg');
    await expect(svg).toBeVisible();
    const path = svg.locator('path');
    await expect(path).toBeVisible();
    const d = await path.getAttribute('d');
    expect(d).not.toBeNull();
    expect(d?.length).toBeGreaterThan(0);
  });
});
