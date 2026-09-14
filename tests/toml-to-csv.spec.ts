import { test, expect } from '@playwright/test';

test.describe('TOML to CSV / TSV Converter Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/toml-to-csv');
    await page.waitForLoadState('networkidle');
  });

  test('renders component elements and default output correctly', async ({ page }) => {
    // Check main labels
    await expect(page.locator('label[for="toml-csv-input"]')).toBeVisible();
    await expect(page.locator('label[for="toml-csv-output"]')).toBeVisible();

    // Verify initial input and output value
    const input = page.locator('#toml-csv-input');
    const output = page.locator('#toml-csv-output');

    await expect(input).not.toBeEmpty();
    await expect(output).not.toBeEmpty();

    const outputVal = await output.inputValue();
    expect(outputVal).toContain('name,ip,role,memory_gb,active');
    expect(outputVal).toContain('web-prod-01,192.168.1.10,frontend,16,true');
  });

  test('switches output delimiters (comma to tab/TSV and pipe)', async ({ page }) => {
    const delimiterSelect = page.locator('#toml-csv-delimiter');
    const output = page.locator('#toml-csv-output');

    // Switch to Tab (TSV) - select option with value "\t"
    await delimiterSelect.selectOption({ value: '\t' });
    let outputVal = await output.inputValue();
    expect(outputVal).toContain("name\tip\trole\tmemory_gb\tactive");

    // Switch to Pipe (|)
    await delimiterSelect.selectOption({ value: '|' });
    outputVal = await output.inputValue();
    expect(outputVal).toContain('name|ip|role|memory_gb|active');
  });

  test('loads quick presets and updates input & output', async ({ page }) => {
    const input = page.locator('#toml-csv-input');
    const output = page.locator('#toml-csv-output');

    // Click User Directory TOML preset button
    const userPresetBtn = page.getByRole('button', { name: /Annuaire Utilisateurs TOML/i });
    await userPresetBtn.click();

    const inputVal = await input.inputValue();
    expect(inputVal).toContain('id = 101');
    expect(inputVal).toContain('username = "alice_v"');

    const outputVal = await output.inputValue();
    expect(outputVal).toContain('id,username,full_name,role,department,email');
    expect(outputVal).toContain('101,alice_v,Alice Vance,Admin,Engineering,alice@example.com');
  });

  test('handles keyboard shortcuts (Esc clear)', async ({ page }) => {
    const input = page.locator('#toml-csv-input');
    const output = page.locator('#toml-csv-output');

    await expect(input).not.toBeEmpty();

    // Focus input and press Escape
    await input.focus();
    await page.keyboard.press('Escape');

    await expect(input).toBeEmpty();
    await expect(output).toBeEmpty();
  });

  test('shows error message on invalid TOML markup', async ({ page }) => {
    const input = page.locator('#toml-csv-input');
    const output = page.locator('#toml-csv-output');

    await input.fill('[[servers]\nname = invalid_unquoted_string_without_quotes');

    // Expect error message container
    await expect(page.locator('div').filter({ hasText: /Erreur|Error/i }).first()).toBeVisible();
    await expect(output).toHaveValue('');
  });
});
