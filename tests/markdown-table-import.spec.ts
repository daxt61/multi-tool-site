import { test, expect } from '@playwright/test';

test.describe('Markdown Table Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/markdown-table');
  });

  test('should import CSV data', async ({ page }) => {
    await page.click('button:has-text("Import CSV")');
    await page.fill('textarea[placeholder*="col1,col2"]', 'ID,Name,Email\n1,Alice,alice@example.com\n2,Bob,bob@example.com');
    await page.click('button:has-text("Import 3 lines")');

    // Check if table contains data
    await expect(page.locator('input[value="ID"]')).toBeVisible();
    await expect(page.locator('input[value="Alice"]')).toBeVisible();
    await expect(page.locator('input[value="bob@example.com"]')).toBeVisible();

    // Check markdown preview
    const preview = page.locator('pre');
    await expect(preview).toContainText('| ID | Name | Email |');
    await expect(preview).toContainText('| 1 | Alice | alice@example.com |');
  });
});
