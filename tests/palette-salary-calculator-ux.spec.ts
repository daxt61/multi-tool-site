import { test, expect } from '@playwright/test';

test('verify salary calculator accessibility, bilingualism and keyboard shortcuts', async ({ page }) => {
  // Navigate to English version of the tool
  await page.goto('http://localhost:5173/en/outil/salary-calculator');

  // Mock clipboard API to avoid permission blocks in headless browser
  await page.evaluate(() => {
    (window as any).clipboardText = '';
    navigator.clipboard.writeText = async (text) => {
      (window as any).clipboardText = text;
    };
  });

  // Verify header localization
  const headingEn = page.locator('h1', { hasText: 'Salary Calculator' });
  await expect(headingEn).toBeVisible();

  // Verify form controls and proper label associations
  const grossSalaryLabel = page.locator('label[for="gross-salary"]');
  await expect(grossSalaryLabel).toBeVisible();
  await expect(grossSalaryLabel).toContainText('Gross Annual Salary');

  const grossSalaryInput = page.locator('#gross-salary');
  await expect(grossSalaryInput).toBeVisible();
  await expect(grossSalaryInput).toHaveValue('35000');

  // Test status radiogroup & active buttons ARIA attributes
  const statusGroup = page.locator('[role="radiogroup"]').first();
  await expect(statusGroup).toBeVisible();

  const nonCadreRadio = page.getByRole('radio', { name: 'Non-executive' });
  await expect(nonCadreRadio).toBeVisible();
  await expect(nonCadreRadio).toHaveAttribute('aria-checked', 'true');

  const cadreRadio = page.getByRole('radio', { name: 'Executive (Cadre)' });
  await expect(cadreRadio).toBeVisible();
  await expect(cadreRadio).toHaveAttribute('aria-checked', 'false');

  // Clicking a radio button should update its state
  await cadreRadio.click();
  await expect(cadreRadio).toHaveAttribute('aria-checked', 'true');
  await expect(nonCadreRadio).toHaveAttribute('aria-checked', 'false');

  // Test reset and focus restoration
  await page.keyboard.press('Escape');

  // Value should be empty after Escape (reset)
  await expect(grossSalaryInput).toHaveValue('');

  // Focus must be returned programmatically to the primary input field
  await expect(grossSalaryInput).toBeFocused();

  // Type a new value
  await page.keyboard.type('45000');
  await expect(grossSalaryInput).toHaveValue('45000');

  // Click the Copy Results button
  const copyBtn = page.getByRole('button', { name: 'Copy Results' });
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  // Toast notification should appear
  const toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  // Verify clipboard has the calculated values
  const copiedText = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText).toContain('Gross Salary');

  // Clear clipboard data
  await page.evaluate(() => { (window as any).clipboardText = ''; });

  // Blur focus to test keyboard shortcut
  await grossSalaryInput.blur();

  // Pressing C should copy the values
  await page.keyboard.press('c');

  // Toast notification should appear again
  await expect(toastNotification).toBeVisible();

  // Verify clipboard has the values from keyboard press
  const copiedText2 = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText2).toContain('Gross Salary');

  // Switch to French version
  await page.goto('http://localhost:5173/fr/outil/salary-calculator');

  // Mock clipboard API on the new page
  await page.evaluate(() => {
    (window as any).clipboardText = '';
    navigator.clipboard.writeText = async (text) => {
      (window as any).clipboardText = text;
    };
  });

  // Verify French translation header
  const headingFr = page.locator('h1', { hasText: 'Salaire' });
  await expect(headingFr).toBeVisible();

  const grossSalaryLabelFr = page.locator('label[for="gross-salary"]');
  await expect(grossSalaryLabelFr).toContainText('Salaire brut annuel');

  const nonCadreRadioFr = page.getByRole('radio', { name: 'Non-cadre' });
  await expect(nonCadreRadioFr).toBeVisible();
});
