import { test, expect } from '@playwright/test';

test.describe('New Tools Smoke Test', () => {
  test('Sentence Manipulator is functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/sentence-manipulator');

    const input = page.locator('#sentence-input');
    await input.fill('Hello world. This is a test! Is it working?');

    await expect(page.locator('text=Sentences: 3')).toBeVisible();

    await page.click('text=Reverse Order');
    await expect(input).toHaveValue('Is it working? This is a test! Hello world.');
  });

  test('Text Columnizer is functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/text-columnizer');

    const input = page.locator('#col-input');
    await input.fill('Item 1\nItem 2\nItem 3\nItem 4');

    // Check if output contains items
    const output = page.locator('pre');
    await expect(output).toContainText('Item 1');
    await expect(output).toContainText('Item 3');
  });

  test('UTF-8 Validator is functional', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/utf8-validator');

    await page.fill('textarea', 'Valid text');
    // Using h4 to be more specific and avoid description/icon
    await expect(page.locator('h4:has-text("Valid UTF-8")')).toBeVisible();

    // Switch to Hex and enter invalid sequence
    await page.click('button:has-text("Hex")');
    await page.fill('textarea', 'FF');
    await expect(page.locator('h4:has-text("Invalid UTF-8")')).toBeVisible();
  });

  test('New tools are visible on dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/en');
    await expect(page.locator('h4:has-text("Sentence Manipulator")')).toBeVisible();
    await expect(page.locator('h4:has-text("Text Columnizer")')).toBeVisible();
    await expect(page.locator('h4:has-text("UTF-8 Validator")')).toBeVisible();
  });
});
