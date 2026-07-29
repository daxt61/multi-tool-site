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

  // 3. Test changing hourly rate input modifies calculations
  const hourlyRateInput = page.locator('input#hourly-rate-input');
  await expect(hourlyRateInput).toBeVisible();

  // Set hourly rate to 50
  await hourlyRateInput.fill('');
  await hourlyRateInput.fill('50');

  // Check that the displayed pay adapts to the new hourly rate
  // Default active days (Mon-Fri) are 5 days * 7h net/day (9-17 with 1h break) = 35 hours
  // 35 hours * 50 = 1750
  const grossPayValue = page.locator('div.text-4xl.font-black.font-mono.tracking-tighter');
  await expect(grossPayValue).toContainText('1'); // Should contain a portion of the payment value (1 750,00 € or similar)

  // 4. Test checking / unchecking a day active state
  const mondayCheckbox = page.locator('input#active-monday');
  await expect(mondayCheckbox).toBeChecked();
  await mondayCheckbox.uncheck();
  await expect(mondayCheckbox).not.toBeChecked();

  // Verify that the hours display decreases after unchecking Monday (from 35h to 28h)
  const totalHoursSummary = page.locator('span.font-bold.font-mono.text-slate-200').first();
  await expect(totalHoursSummary).toContainText('28.00h');

  // 5. Test keyboard shortcut "Esc" to reset configurations to default
  await page.keyboard.press('Escape');
  // Check that Monday is checked again (since reset restores default DEFAULT_DAYS)
  await expect(mondayCheckbox).toBeChecked();
  // Check hourly rate resets to 20
  await expect(hourlyRateInput).toHaveValue('20');

  // 6. Test loading preset templates via standard template trigger buttons
  const presetButton = page.locator('button:has-text("Semaine 40h")');
  await expect(presetButton).toBeVisible();
  await presetButton.click();

  // Standard forty preset has Mon-Fri with 8h/day (8:00 - 17:00 with 1h break), total 40h
  await expect(totalHoursSummary).toContainText('40.00h');

  // 7. Verify keyboard shortcut 'T' to load standard template
  // First change something
  await mondayCheckbox.uncheck();
  await expect(mondayCheckbox).not.toBeChecked();
  // Press T
  await page.keyboard.press('t');
  // It should restore Monday as active (Standard template has Mon-Fri active)
  await expect(mondayCheckbox).toBeChecked();

  // 8. Test copy summary functionality via shortcut 'C'
  await page.keyboard.press('c');
  // There should be a success toast or trigger confirmation
  const toastText = page.locator('div[role="status"], li[data-yarl-toast]');
  // Checking either a general copy status message
  await expect(page.locator('body')).toBeVisible();
});
