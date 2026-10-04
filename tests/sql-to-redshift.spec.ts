import { test, expect } from '@playwright/test';

test.describe('SQL to Amazon Redshift Tool Suite', () => {
  test('SQL to Redshift converts DDL statements and supports diststyle, sortkey, encoding, casing, and presets', async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('http://localhost:5173/en/outil/sql-to-redshift');
    await page.waitForLoadState('networkidle');

    const inputArea = page.locator('#sql-redshift-input');
    const outputArea = page.locator('#redshift-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Verify initial preset conversion output
    let outputText = await outputArea.inputValue();
    expect(outputText).toContain('CREATE TABLE IF NOT EXISTS');
    expect(outputText).toContain('products');
    expect(outputText).toContain('INTEGER');
    expect(outputText).toContain('ENCODE AZ64');
    expect(outputText).toContain('DISTSTYLE AUTO');
    expect(outputText).toContain('SORTKEY AUTO');

    // Test preset switching
    const presetButton = page.locator('button', { hasText: 'User Sessions & Event Analytics' });
    await expect(presetButton).toBeVisible();
    await presetButton.click();

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('event_logs');
    expect(outputText).toContain('TIMESTAMPTZ');

    // Test Table Prefix option change
    const prefixSelect = page.locator('#redshift-prefix-select');
    await prefixSelect.selectOption('CREATE TEMPORARY TABLE');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('CREATE TEMPORARY TABLE event_logs');

    // Test DistStyle option change
    const distSelect = page.locator('#redshift-diststyle-select');
    await distSelect.selectOption('KEY');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('DISTSTYLE KEY');
    expect(outputText).toContain('DISTKEY (');

    // Test SortKey option change
    const sortSelect = page.locator('#redshift-sortkey-select');
    await sortSelect.selectOption('COMPOUND');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('COMPOUND SORTKEY (');

    // Test Encoding option change
    const encodingSelect = page.locator('#redshift-encoding-select');
    await encodingSelect.selectOption('ZSTD');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('ENCODE ZSTD');

    // Test Casing option change
    const casingSelect = page.locator('#redshift-casing-select');
    await casingSelect.selectOption('camelCase');

    outputText = await outputArea.inputValue();
    expect(outputText).toContain('eventId');
    expect(outputText).toContain('sessionId');

    // Test Copy button
    const copyButton = page.locator('button', { hasText: 'Copy' }).first();
    await copyButton.click();

    // Test Clear button and focus restoration
    const clearButton = page.locator('button', { hasText: 'Clear' }).first();
    await clearButton.click();

    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
    await expect(inputArea).toBeFocused();
  });
});
