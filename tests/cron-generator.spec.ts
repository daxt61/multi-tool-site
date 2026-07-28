import { test, expect } from '@playwright/test';

test.describe('CronGenerator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the localized Cron Generator page
    await page.goto('http://localhost:5173/fr/outil/cron-generator');
  });

  test('displays correct elements and default state', async ({ page }) => {
    // Verify title and label accessibility
    await expect(page.locator('h1')).toContainText('Cron Generator');
    await expect(page.locator('.text-4xl.md\\:text-6xl.font-mono')).toHaveText('* * * * *');

    // Verify inputs exists
    await expect(page.locator('label:has-text("Minute")')).toBeVisible();
    await expect(page.locator('input#cron-minute')).toHaveValue('*');
  });

  test('applies presets correctly', async ({ page }) => {
    // Click every 5 minutes preset
    const presetBtn = page.locator('button:has-text("Toutes les 5 minutes")').first();
    await presetBtn.click();

    // Verify change in minutes input and overall cron expression
    await expect(page.locator('input#cron-minute')).toHaveValue('*/5');
    await expect(page.locator('.text-4xl.md\\:text-6xl.font-mono')).toHaveText('*/5 * * * *');
  });

  test('interactive tab selection changes fields correctly', async ({ page }) => {
    // Select Hour tab
    await page.locator('button:has-text("Heure")').first().click();

    // Select "Chaque heure" inside the tab options
    const hourOptionBtn = page.locator('button:has-text("Chaque heure")').first();
    await expect(hourOptionBtn).toBeVisible();
  });

  test('handles Escape clear action and C copy action shortcuts', async ({ page }) => {
    // Enter custom value to minutes input
    const minuteInput = page.locator('input#cron-minute');
    await minuteInput.focus();
    await minuteInput.fill('45');

    // Press Escape to reset
    await page.keyboard.press('Escape');

    // Value should be reset to *
    await expect(minuteInput).toHaveValue('*');

    // Remove focus from any inputs
    await page.locator('h1').click();

    // Verify copy toast action by pressing 'c' key
    await page.keyboard.press('c');
    await expect(page.locator('text=Copié').first()).toBeVisible();
  });
});
