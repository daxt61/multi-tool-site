import { test, expect } from '@playwright/test';

test.describe('JSON Key Case Converter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the localized JSON key case converter page
    await page.goto('http://localhost:5173/en/outil/json-casing-converter');
  });

  test('should render properly with default state and preset options', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('JSON Key Case Converter');

    // Check default input JSON exists
    const inputArea = page.locator('textarea#json-input');
    await expect(inputArea).toBeVisible();
    const val = await inputArea.inputValue();
    expect(val).toContain('first_name');
    expect(val).toContain('LastName');

    // Output JSON should be formatted in camelCase by default
    const outputArea = page.locator('textarea[readonly]');
    await expect(outputArea).toBeVisible();
    const outputVal = await outputArea.inputValue();
    expect(outputVal).toContain('"firstName"');
    expect(outputVal).toContain('"lastName"');
    expect(outputVal).toContain('"companyDetails"');
    expect(outputVal).toContain('"officeLocations"');
  });

  test('should convert keys recursively using different casing options', async ({ page }) => {
    // Select snake_case
    await page.click('button:has-text("snake_case")');
    let outputVal = await page.locator('textarea[readonly]').inputValue();
    expect(outputVal).toContain('"first_name"');
    expect(outputVal).toContain('"last_name"');
    expect(outputVal).toContain('"company_details"');
    expect(outputVal).toContain('"office_locations"');

    // Select PascalCase
    await page.click('button:text("PascalCase")');
    outputVal = await page.locator('textarea[readonly]').inputValue();
    expect(outputVal).toContain('"FirstName"');
    expect(outputVal).toContain('"LastName"');
    expect(outputVal).toContain('"CompanyDetails"');
    expect(outputVal).toContain('"OfficeLocations"');

    // Select kebab-case
    await page.click('button:text("kebab-case")');
    outputVal = await page.locator('textarea[readonly]').inputValue();
    expect(outputVal).toContain('"first-name"');
    expect(outputVal).toContain('"last-name"');
    expect(outputVal).toContain('"company-details"');
    expect(outputVal).toContain('"office-locations"');

    // Select CONST_CASE
    await page.click('button:text("CONST_CASE")');
    outputVal = await page.locator('textarea[readonly]').inputValue();
    expect(outputVal).toContain('"FIRST_NAME"');
    expect(outputVal).toContain('"LAST_NAME"');
    expect(outputVal).toContain('"COMPANY_DETAILS"');
    expect(outputVal).toContain('"OFFICE_LOCATIONS"');
  });

  test('should support presets and copy/clear events with keyboard shortcuts', async ({ page }) => {
    // Apply "SaaS Config" preset
    await page.click('button:text("SaaS Config")');
    const inputVal = await page.locator('textarea#json-input').inputValue();
    expect(inputVal).toContain('"database.config"');

    // Convert SaaS config to camelCase
    await page.click('button:text("camelCase")');
    const outputVal = await page.locator('textarea[readonly]').inputValue();
    expect(outputVal).toContain('"databaseConfig"');
    expect(outputVal).toContain('"hostName"');
    expect(outputVal).toContain('"portNumber"');
    expect(outputVal).toContain('"maxConnectionsPool"');

    // Click clear button
    await page.click('button:has-text("Clear")');
    await expect(page.locator('textarea#json-input')).toHaveValue('');
    await expect(page.locator('textarea[readonly]')).toHaveValue('');

    // Trigger shortcut Escape to clear and verify focus is preserved back to input JSON
    await page.click('button:text("User Profile")');
    await page.keyboard.press('Escape');
    await expect(page.locator('textarea#json-input')).toBeFocused();
    await expect(page.locator('textarea#json-input')).toHaveValue('');
  });

  test('should display proper error messages for invalid inputs', async ({ page }) => {
    await page.locator('textarea#json-input').fill('{"unclosed": "brace"');
    await expect(page.locator('.text-rose-400')).toBeVisible();
    await expect(page.locator('.text-rose-400')).toContainText('Invalid JSON');
  });
});

test.describe('Markdown Table Generator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/markdown-table');
  });

  test('should load default table and copy markdown', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Markdown Table');
    const tableInput = page.locator('input[value="Header 1"]');
    await expect(tableInput).toBeVisible();

    // Verify copying markdown triggers a success toast
    await page.click('button:has-text("Copy Markdown")');
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  });

  test('should support CSV/TSV/Pipe smart auto-delimiter detection on import', async ({ page }) => {
    // Open Import CSV dialog
    await page.click('button:has-text("Import CSV")');
    await expect(page.locator('textarea[placeholder*="col1,col2,col3"]')).toBeVisible();

    // Import Semicolon Separated Values
    const csvInput = 'Team;Score;Rank\nParis;100;1\nLondon;90;2';
    await page.locator('textarea[placeholder*="col1,col2,col3"]').fill(csvInput);
    await page.click('button:has-text("Import 3 lines")');

    // Check if imported successfully
    await expect(page.locator('input[value="Team"]')).toBeVisible();
    await expect(page.locator('input[value="London"]')).toBeVisible();

    const preview = await page.locator('pre').textContent();
    expect(preview).toContain('| Team | Score | Rank |');
    expect(preview).toContain('| London | 90 | 2 |');
  });
});
