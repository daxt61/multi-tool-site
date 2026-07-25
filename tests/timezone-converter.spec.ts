import { test, expect } from '@playwright/test';

test('verify TimezoneConverter meeting planner and tracked list', async ({ page }) => {
  // Navigation to the Timezone Converter tool path
  await page.goto('http://localhost:5173/fr/outil/timezone-converter');

  // Verify parameters sections exist
  const dateLabel = page.locator('label[for="base-date"]');
  await expect(dateLabel).toBeVisible();

  const timeLabel = page.locator('label[for="base-time"]');
  await expect(timeLabel).toBeVisible();

  // Verify tracked list has multiple initial timezones
  const trackedHeader = page.locator('h3:has-text("Fuseaux Suivis & Convertis")');
  await expect(trackedHeader).toBeVisible();

  // There should be a slider for planning meetings
  const hourSlider = page.locator('input[type="range"]');
  await expect(hourSlider).toBeVisible();

  // Search input for autocompletion
  const searchInput = page.locator('input#tz-search');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('London');

  // Drops down option for selection
  const londonButton = page.locator('button:has-text("Europe/London")');
  await expect(londonButton).toBeVisible();
  await londonButton.click();

  // Search query should have cleared after adding
  const currentSearchValue = await searchInput.inputValue();
  expect(currentSearchValue).toBe('');

  // Check exporter details are visible
  const exportersTitle = page.locator('h4:has-text("Exportateurs (ISO, Unix, UTC)")');
  await expect(exportersTitle).toBeVisible();

  // Check resetting to current time is operational
  const resetBtn = page.locator('button:has-text("Réinitialiser à maintenant")');
  await expect(resetBtn).toBeVisible();
  await resetBtn.click();
});
