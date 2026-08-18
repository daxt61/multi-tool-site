import { test, expect } from '@playwright/test';

test.describe('Number Extractor & Cron Parser Tests', () => {
  test('Number Extractor - presets, extraction, sorting, and keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/number-extractor');
    await expect(page.locator('[data-testid="number-extractor-container"]')).toBeVisible();

    // Click on "Receipt & Invoice Audit" preset
    await page.click('button:has-text("Receipt & Invoice Audit")');
    const input = page.locator('#extractor-input');
    await expect(input).toHaveValue(/INVOICE #94820/);

    // Verify numbers extracted
    const numbersList = page.locator('#extractor-output-list');
    await expect(numbersList).toContainText('94820');
    await expect(numbersList).toContainText('14.99');
    await expect(numbersList).toContainText('146.33');

    // Test sort order toggle (ASC)
    await page.click('button:has-text("ASC")');

    // Test Escape key clears input and focuses textarea
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('Cron Parser - parsing, explanation, upcoming executions, presets, and keyboard shortcuts', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/cron-parser');
    await page.waitForLoadState('networkidle');

    const container = page.locator('[data-testid="cron-parser-container"]');
    await expect(container).toBeVisible();

    // Default cron expression
    const cronInput = page.locator('#cron-parser-input');
    await expect(cronInput).toHaveValue('*/15 * * * *');

    // Human readable schedule check
    await expect(container).toContainText('Every 15 minutes of every hour');

    // Check upcoming executions
    await expect(container).toContainText('Next 10 Upcoming Executions');

    // Click preset "Daily at midnight"
    await page.click('button:has-text("Daily at midnight")');
    await expect(cronInput).toHaveValue('0 0 * * *');
    await expect(container).toContainText('At minute 0 at 00:00');

    // Test Escape key clears input and focuses
    await page.keyboard.press('Escape');
    await expect(cronInput).toHaveValue('');
    await expect(cronInput).toBeFocused();
  });
});
