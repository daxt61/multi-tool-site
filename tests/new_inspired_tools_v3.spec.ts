import { test, expect } from '@playwright/test';

test.describe('New Inspired Tools V3', () => {
  test('CSV to ASCII Table should be functional', async ({ page }) => {
    await page.goto('/en/outil/csv-to-ascii');
    await expect(page.locator('h1')).toContainText('CSV to ASCII Table');

    await page.fill('#csv-input', 'A,B\n1,2');
    // Check if output contains bordered table elements
    await expect(page.locator('.whitespace-pre')).toContainText('+---');

    // Change to Unicode
    // Try to find the button more specifically if possible, or just wait longer
    await page.click('button:has-text("Unicode")');

    // Wait for the UI to update
    await expect(page.locator('.whitespace-pre')).toContainText('┌───', { timeout: 10000 });
  });

  test('String Manipulator should be functional', async ({ page }) => {
    await page.goto('/en/outil/string-manipulator');
    await expect(page.locator('h1')).toContainText('String Manipulator');

    await page.fill('#manip-input', 'Hello');

    // Test padding
    await page.fill('input[placeholder="Char..."]', '*');
    await page.click('button[title="right"]');
    // Result depends on target length, default is 20
    await expect(page.locator('#manip-output')).toHaveValue(/Hello\*{15}/);

    // Test truncation
    await page.click('button[title="none"]'); // Disable padding
    await page.fill('#manip-input', 'This is a very long string that should be truncated');
    await page.click('button[title="end"]');
    // Default length 20
    await expect(page.locator('#manip-output')).toHaveValue(/This is a very long \.\.\./);
  });
});
