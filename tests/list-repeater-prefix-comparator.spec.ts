import { test, expect } from '@playwright/test';

test.describe('List Repeater, Line Prefix/Suffix & List Comparator E2E Tests', () => {
  test('ListRepeater - presets, multiplier, repetition patterns, copy, clear', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-repeater');
    await page.waitForSelector('[data-testid="list-repeater-container"]');

    const inputArea = page.locator('#list-repeater-input');
    const outputArea = page.locator('#list-repeater-output');

    // Type input
    await inputArea.fill('Apple\nBanana');
    await expect(outputArea).toHaveValue('Apple\nApple\nApple\nBanana\nBanana\nBanana');

    // Switch repeat pattern to Sequence
    await page.click('button:has-text("Sequence (A,B,A,B)")');
    await expect(outputArea).toHaveValue('Apple\nBanana\nApple\nBanana\nApple\nBanana');

    // Click Preset: Indexed Batch Keys
    await page.click('button:has-text("Indexed Batch Keys")');
    await expect(inputArea).toHaveValue('User_Auth\nPayment_Gateway\nNotification_Service');
    await expect(outputArea).toContainText('01#User_Auth');

    // Clear with Escape key shortcut when focus is in textarea
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });

  test('LinePrefixSuffix - presets, prefix & suffix additions, numbering, clear', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/line-prefix-suffix');
    await page.waitForSelector('[data-testid="line-prefix-suffix-container"]');

    const inputArea = page.locator('#input-text');
    const outputArea = page.locator('#output-text');
    const prefInput = page.locator('#pref-input');
    const suffInput = page.locator('#suff-input');

    // Input text and add prefix/suffix
    await inputArea.fill('Line 1\nLine 2');
    await prefInput.fill('>> ');
    await suffInput.fill(' <<');

    await expect(outputArea).toHaveValue('>> Line 1 <<\n>> Line 2 <<');

    // Test SQL Preset
    await page.click('button:has-text("SQL Quotes")');
    await expect(inputArea).toHaveValue('USR-1001\nUSR-1002\nUSR-1003');
    await expect(outputArea).toHaveValue("'USR-1001',\n'USR-1002',\n'USR-1003',");

    // Clear via Escape key
    await inputArea.focus();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
    await expect(outputArea).toHaveValue('');
  });

  test('ListComparator - set operations, presets, case sensitivity, clear', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-comparator');
    await page.waitForSelector('[data-testid="list-comparator-container"]');

    const listAInput = page.locator('#list-a');
    const listBInput = page.locator('#list-b');

    // Fill lists A and B
    await listAInput.fill('Apple\nBanana\nCherry');
    await listBInput.fill('Banana\nDate\nCherry');

    // Verify Common items count (Banana, Cherry -> 2)
    const commonCount = page.locator('.text-2xl').first();
    await expect(commonCount).toHaveText('2');

    // Load User Email Audit preset
    await page.click('button:has-text("User Email Audit")');
    await expect(listAInput).toContainText('alice@company.com');
    await expect(listBInput).toContainText('bob@company.com');

    // Clear via Escape key
    await listAInput.focus();
    await page.keyboard.press('Escape');
    await expect(listAInput).toHaveValue('');
    await expect(listBInput).toHaveValue('');
  });
});
