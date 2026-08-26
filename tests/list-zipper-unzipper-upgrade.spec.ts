import { test, expect } from '@playwright/test';

test.describe('List Zipper & Unzipper Upgrade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/list-zipper-unzipper');
    await page.waitForSelector('[role="region"][aria-label="Zip & Unzip Lists"]');
  });

  test('should combine two lists with custom separator and presets in Zip mode', async ({ page }) => {
    // Click Quick Preset "First & Last Names"
    const presetBtn = page.getByRole('button', { name: 'First & Last Names' });
    await presetBtn.click();

    // Verify inputs populated
    const inputA = page.locator('#zip-list-a');
    const inputB = page.locator('#zip-list-b');
    await expect(inputA).toHaveValue('Alice\nBob\nCharlie\nDiana');
    await expect(inputB).toHaveValue('Smith\nJohnson\nBrown\nPrince');

    // Verify output
    const output = page.locator('#zip-output');
    await expect(output).toHaveValue('Alice Smith\nBob Johnson\nCharlie Brown\nDiana Prince');

    // Test URL Query preset
    const queryPresetBtn = page.getByRole('button', { name: 'URL Query Params' });
    await queryPresetBtn.click();
    await expect(output).toHaveValue('?user=john_doe&\n?role=admin&\n?status=active&\n?page=1&');

    // Test clear with Escape key
    await page.keyboard.press('Escape');
    await expect(inputA).toHaveValue('');
    await expect(inputB).toHaveValue('');
    await expect(output).toHaveValue('');
  });

  test('should split combined text list with presets and delimiters in Unzip mode', async ({ page }) => {
    // Switch to Unzip tab
    const unzipTab = page.getByRole('button', { name: 'Unzip / Split Lists' });
    await unzipTab.click();

    // Click Quick Preset "Key-Value Split (=)"
    const presetBtn = page.getByRole('button', { name: 'Key-Value Split (=)' });
    await presetBtn.click();

    const combinedInput = page.locator('#combined-list-input');
    await expect(combinedInput).toHaveValue('host = localhost\nport = 5432\ndatabase = production_db\nusername = admin');

    const outputA = page.locator('#unzip-output-a');
    const outputB = page.locator('#unzip-output-b');
    await expect(outputA).toHaveValue('host\nport\ndatabase\nusername');
    await expect(outputB).toHaveValue('localhost\n5432\nproduction_db\nadmin');

    // Test Interleaved Lines preset
    const interPreset = page.getByRole('button', { name: 'Interleaved Lines' });
    await interPreset.click();
    await expect(outputA).toHaveValue('First Name\nLast Name\nEmail');
    await expect(outputB).toHaveValue('Alice\nSmith\nalice@example.com');
  });
});
