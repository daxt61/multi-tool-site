import { test, expect } from '@playwright/test';

test('verify overtime calculator presets, accessibility, toasts, and keyboard shortcuts', async ({ page }) => {
  // Navigate to English version
  await page.goto('http://localhost:5173/en/outil/overtime-calculator');

  // Mock clipboard API
  await page.evaluate(() => {
    (window as any).clipboardText = '';
    navigator.clipboard.writeText = async (text) => {
      (window as any).clipboardText = text;
    };
  });

  // Check header / labels
  const hourlyRateLabel = page.locator('label[for="hourly-rate"]');
  await expect(hourlyRateLabel).toBeVisible();
  await expect(hourlyRateLabel).toContainText('Gross Hourly Rate');

  const hourlyRateInput = page.locator('#hourly-rate');
  await expect(hourlyRateInput).toBeVisible();
  await expect(hourlyRateInput).toHaveValue('15');

  // Check preset buttons
  const standardPresetBtn = page.getByRole('button', { name: 'Standard Week (+5h)' });
  await expect(standardPresetBtn).toBeVisible();

  // Click standard preset button
  await standardPresetBtn.click();

  // Verify preset applied values and aria-pressed state
  await expect(standardPresetBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#hours-25')).toHaveValue('5');
  await expect(page.locator('#hours-50')).toHaveValue('0');

  // Toast should be visible for preset
  let toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  // Test Copy Summary button
  const copyBtn = page.getByRole('button', { name: /Copy Summary/i });
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  const copiedText = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText).toContain('Overtime Calculator');
  expect(copiedText).toContain('Gross Hourly Rate');
  expect(copiedText).toContain('Hours at +25%: 5h');

  // Clear mock clipboard
  await page.evaluate(() => { (window as any).clipboardText = ''; });

  // Test Reset via Escape key
  await page.keyboard.press('Escape');

  // Verify hours reset and focus restored to #hourly-rate
  await expect(page.locator('#hours-25')).toHaveValue('0');
  await expect(hourlyRateInput).toBeFocused();

  toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  // Test 'C' shortcut when not focused on an input
  await hourlyRateInput.blur();
  await page.keyboard.press('c');

  toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  const copiedText2 = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText2).toContain('Overtime Calculator');

  // Switch to French route
  await page.goto('http://localhost:5173/fr/outil/overtime-calculator');

  // Verify French translation
  const hourlyRateLabelFr = page.locator('label[for="hourly-rate"]');
  await expect(hourlyRateLabelFr).toContainText('Taux horaire brut');

  const standardPresetBtnFr = page.getByRole('button', { name: 'Semaine Standard (+5h)' });
  await expect(standardPresetBtnFr).toBeVisible();
});
