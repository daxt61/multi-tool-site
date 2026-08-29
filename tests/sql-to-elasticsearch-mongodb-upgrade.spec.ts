import { test, expect } from '@playwright/test';

test.describe('SQL to Elasticsearch and SQL to MongoDB Tools', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  });

  test('SQL to Elasticsearch - converts query, loads presets, and toggles format', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-elasticsearch');

    // Check title and label
    await expect(page.locator('h1')).toContainText('SQL en Elasticsearch');
    await expect(page.locator('label[for="sql-elastic-input"]')).toBeVisible();

    // Click Product Search preset
    await page.click('button:has-text("Recherche de Produits")');
    const inputVal = await page.inputValue('#sql-elastic-input');
    expect(inputVal).toContain('SELECT id, title, price, category, status');

    // Check generated Elasticsearch Query DSL output
    const outputVal = await page.inputValue('#sql-elastic-output');
    expect(outputVal).toContain('"track_total_hits": true');
    expect(outputVal).toContain('"category": "Electronics"');
    expect(outputVal).toContain('"sort"');

    // Change output mode to cURL
    await page.selectOption('#output-mode-select', 'curl');
    const curlVal = await page.inputValue('#sql-elastic-output');
    expect(curlVal).toContain('curl -X POST "http://localhost:9200/products/_search"');

    // Verify copy button works inside tool view
    await page.click('button:has-text("Copier") >> nth=1');
    await expect(page.locator('text=Copié').first()).toBeVisible({ timeout: 5000 });
  });

  test('SQL to MongoDB - converts query, loads presets, and handles shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/sql-to-mongodb');

    // Check title
    await expect(page.locator('h1')).toContainText('SQL en MongoDB');

    // Load Insert preset
    await page.click('button:has-text("Insertion Produits")');
    const inputVal = await page.inputValue('#sql-mongo-input');
    expect(inputVal).toContain('INSERT INTO products');

    // Check generated MongoDB shell command
    const outputVal = await page.inputValue('#sql-mongo-output');
    expect(outputVal).toContain('db.products.insertMany');
    expect(outputVal).toContain('"title": "Wireless Mouse"');

    // Load Filter Users preset
    await page.click('button:has-text("Filtrer Utilisateurs")');
    const selectOutput = await page.inputValue('#sql-mongo-output');
    expect(selectOutput).toContain('db.users.find');
    expect(selectOutput).toContain('"status": "active"');
    expect(selectOutput).toContain('$gte');

    // Test clear shortcut (Esc)
    await page.click('#sql-mongo-input');
    await page.keyboard.press('Escape');
    const clearedInput = await page.inputValue('#sql-mongo-input');
    expect(clearedInput).toBe('');
  });
});
