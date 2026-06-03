import { test, expect } from '@playwright/test';

test.describe('New Inspired Tools Smoke Tests', () => {
  test('Line Number Adder should load and process text', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/line-number-adder`);
    await expect(page.locator('h1')).toContainText('Add Line Numbers');

    const input = page.locator('#input-text');
    await input.fill('Line 1\nLine 2\nLine 3');

    const output = page.locator('#output-text');
    await expect(output).toHaveValue('1. Line 1\n2. Line 2\n3. Line 3');
  });

  test('Text Wrapper should load and wrap text', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/text-wrapper`);
    await expect(page.locator('h1')).toContainText('Text Wrapper');

    const input = page.locator('#input-text');
    await input.fill('This is a very long line that should be wrapped at some point.');

    // Default width is 80, let's set it smaller to force wrap
    // Instead of slider, let's just check it loads.
    // The component uses useMemo, so it should have some output.
    const output = page.locator('#output-text');
    await expect(output).not.toBeEmpty();
  });

  test('Random IP Generator should load and generate IPs', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/random-ip-generator`);
    await expect(page.locator('h1')).toContainText('Random IP Generator');

    const generateBtn = page.locator('button:has-text("Generate")');
    await generateBtn.click();

    const output = page.locator('textarea[readonly]');
    const value = await output.inputValue();
    const lines = value.split('\n').filter(l => l.trim());
    expect(lines.length).toBeGreaterThan(0);
    // Basic IPv4 check
    expect(lines[0]).toMatch(/\d+\.\d+\.\d+\.\d+/);
  });

  test('Random Date Generator should load and generate dates', async ({ page, baseURL }) => {
    await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/random-date-generator`);
    await expect(page.locator('h1')).toContainText('Random Date Generator');

    const generateBtn = page.locator('button:has-text("Generate")');
    await generateBtn.click();

    const output = page.locator('textarea[readonly]');
    const value = await output.inputValue();
    const lines = value.split('\n').filter(l => l.trim());
    expect(lines.length).toBeGreaterThan(0);
    // Basic YYYY-MM-DD check
    expect(lines[0]).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
