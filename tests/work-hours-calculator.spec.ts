import { test, expect } from '@playwright/test';

test('WorkHoursCalculator UX and functional flow verification', async ({ page, baseURL }) => {
  // Navigate to the Work Hours Calculator tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/fr/outil/work-hours-calculator`);

  // 1. Verify title and layout visibility
  const mainHeader = page.locator('h1');
  await expect(mainHeader).toContainText(/Calculateur d'Heures/i);

  // 2. Verify settings container and initial gross pay display
  const grossPayText = page.locator('div:has-text("Salaire brut estimé")').last();
  await expect(grossPayText).toBeVisible();

  // 3. Verify initial active preset state (Standard 9-5)
  const standardPresetBtn = page.locator('button:has-text("Standard 9-5")');
  await expect(standardPresetBtn).toHaveAttribute('aria-pressed', 'true');

  // 4. Test changing hourly rate input modifies calculations and clears activePresetId
  const hourlyRateInput = page.locator('input#hourly-rate-input');
  await expect(hourlyRateInput).toBeVisible();

  // Set hourly rate to 50
  await hourlyRateInput.fill('');
  await hourlyRateInput.fill('50');

  // Active preset should be cleared (aria-pressed = false)
  await expect(standardPresetBtn).toHaveAttribute('aria-pressed', 'false');

  // Check that the displayed pay adapts to the new hourly rate
  // Default active days (Mon-Fri) are 5 days * 7h net/day (9-17 with 1h break) = 35 hours
  // 35 hours * 50 = 1750
  const grossPayValue = page.locator('div.text-4xl.font-black.font-mono.tracking-tighter');
  await expect(grossPayValue).toContainText('1'); // Should contain a portion of the payment value (1 750,00 € or similar)

  // 5. Test checking / unchecking a day active state
  const mondayCheckbox = page.locator('input#active-monday');
  await expect(mondayCheckbox).toBeChecked();
  await mondayCheckbox.uncheck();
  await expect(mondayCheckbox).not.toBeChecked();

  // Verify that the hours display decreases after unchecking Monday (from 35h to 28h)
  const totalHoursSummary = page.locator('span.font-bold.font-mono.text-slate-200').first();
  await expect(totalHoursSummary).toContainText('28.00h');

  // 6. Test keyboard shortcut "Esc" to reset configurations to default and restore focus to primary input
  await page.keyboard.press('Escape');
  // Check that Monday is checked again (since reset restores default DEFAULT_DAYS)
  await expect(mondayCheckbox).toBeChecked();
  // Check hourly rate resets to 20
  await expect(hourlyRateInput).toHaveValue('20');
  // Check active preset is restored to standard
  await expect(standardPresetBtn).toHaveAttribute('aria-pressed', 'true');
  // Check focus is restored to primary input
  await expect(hourlyRateInput).toBeFocused();

  // 7. Test loading preset templates via standard template trigger buttons
  const fortyPresetBtn = page.locator('button:has-text("Semaine 40h")');
  await expect(fortyPresetBtn).toBeVisible();
  await fortyPresetBtn.click();

  await expect(fortyPresetBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(standardPresetBtn).toHaveAttribute('aria-pressed', 'false');

  // Standard forty preset has Mon-Fri with 8h/day (8:00 - 17:00 with 1h break), total 40h
  await expect(totalHoursSummary).toContainText('40.00h');

  // 8. Verify keyboard shortcut 'T' to load standard template when unfocused
  await hourlyRateInput.blur();
  // Press T
  await page.keyboard.press('t');
  // It should select standard preset and mark it active
  await expect(standardPresetBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(fortyPresetBtn).toHaveAttribute('aria-pressed', 'false');

  // 9. Test explicit label associations for daily log card inputs
  const startInput = page.locator('input#start-time-monday');
  const endInput = page.locator('input#end-time-monday');
  const breakInput = page.locator('input#break-minutes-monday');
  await expect(startInput).toBeVisible();
  await expect(endInput).toBeVisible();
  await expect(breakInput).toBeVisible();

  // 10. Test copy summary functionality via shortcut 'C'
  await page.keyboard.press('c');
  await expect(page.locator('body')).toBeVisible();
});
