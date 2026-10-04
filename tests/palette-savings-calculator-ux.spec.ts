import { test, expect } from '@playwright/test';

test('verify savings calculator accessibility, bilingualism, toasts and keyboard shortcuts', async ({ page }) => {
  // Navigate to English version of the tool
  await page.goto('http://localhost:5173/en/outil/savings-calculator');

  // Mock clipboard API to avoid permission blocks in headless browser
  await page.evaluate(() => {
    (window as any).clipboardText = '';
    navigator.clipboard.writeText = async (text) => {
      (window as any).clipboardText = text;
    };
  });

  // Verify header localization
  const headingEn = page.locator('h1', { hasText: 'Savings Calculator' });
  await expect(headingEn).toBeVisible();

  // Verify form controls and proper label associations
  const initialAmountLabel = page.locator('label[for="initialAmount"]');
  await expect(initialAmountLabel).toBeVisible();
  await expect(initialAmountLabel).toContainText('Initial Capital');

  const initialAmountInput = page.locator('#initialAmount');
  await expect(initialAmountInput).toBeVisible();

  const monthlyDepositLabel = page.locator('label[for="monthlyDeposit"]');
  await expect(monthlyDepositLabel).toBeVisible();
  await expect(monthlyDepositLabel).toContainText('Monthly Deposit');

  const annualRateLabel = page.locator('label[for="annualRate"]');
  await expect(annualRateLabel).toBeVisible();
  await expect(annualRateLabel).toContainText('Annual Interest Rate');

  const yearsLabel = page.locator('label[for="years"]');
  await expect(yearsLabel).toBeVisible();
  await expect(yearsLabel).toContainText('Duration (years)');

  // Fill in inputs
  await initialAmountInput.fill('5000');
  await page.locator('#monthlyDeposit').fill('200');
  await page.locator('#annualRate').fill('5');
  await page.locator('#years').fill('10');

  // Test Copy Summary button
  const copyBtn = page.getByRole('button', { name: 'Copy Summary' });
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  // Toast notification should appear
  const toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  // Verify clipboard content
  const copiedText = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText).toContain('Estimated Final Capital');
  expect(copiedText).toContain('Total Deposited');

  // Clear clipboard
  await page.evaluate(() => { (window as any).clipboardText = ''; });

  // Test Reset via Escape key
  await page.keyboard.press('Escape');

  // Values should be reset
  await expect(initialAmountInput).toHaveValue('');
  await expect(page.locator('#monthlyDeposit')).toHaveValue('');

  // Focus must be returned programmatically to initialAmount input
  await expect(initialAmountInput).toBeFocused();

  // Type new value and test 'C' shortcut when not focused on an input
  await initialAmountInput.fill('1000');
  await initialAmountInput.blur();

  await page.keyboard.press('c');

  // Toast should appear again
  await expect(toastNotification).toBeVisible();
  const copiedText2 = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText2).toContain('Estimated Final Capital');

  // Switch to French version
  await page.goto('http://localhost:5173/fr/outil/savings-calculator');

  // Verify French translation
  const initialAmountLabelFr = page.locator('label[for="initialAmount"]');
  await expect(initialAmountLabelFr).toContainText('Capital initial');

  const monthlyDepositLabelFr = page.locator('label[for="monthlyDeposit"]');
  await expect(monthlyDepositLabelFr).toContainText('Versement mensuel');
});
