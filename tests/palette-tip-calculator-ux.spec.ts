import { test, expect } from '@playwright/test';

test('verify tip calculator presets, accessibility, toasts, and keyboard shortcuts', async ({ page }) => {
  // Navigate to English version
  await page.goto('http://localhost:5173/en/outil/tip-calculator');

  // Mock clipboard API
  await page.evaluate(() => {
    (window as any).clipboardText = '';
    navigator.clipboard.writeText = async (text) => {
      (window as any).clipboardText = text;
    };
  });

  // Check bill amount label and input
  const billLabel = page.locator('label[for="bill-amount"]');
  await expect(billLabel).toBeVisible();
  await expect(billLabel).toContainText('Bill Amount');

  const billInput = page.locator('#bill-amount');
  await expect(billInput).toBeVisible();
  await billInput.fill('100.00');

  // Check preset buttons
  const casualPresetBtn = page.getByRole('button', { name: 'Casual Dining (15% tip, 2 people)' });
  await expect(casualPresetBtn).toBeVisible();

  // Click casual preset button
  await casualPresetBtn.click();

  // Verify preset applied values and aria-pressed state
  await expect(casualPresetBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#people-count')).toHaveValue('2');

  // Toast should be visible for preset
  let toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  // Check ARIA range slider properties
  const tipRange = page.locator('#tip-range');
  await expect(tipRange).toHaveAttribute('aria-valuemin', '0');
  await expect(tipRange).toHaveAttribute('aria-valuemax', '50');
  await expect(tipRange).toHaveAttribute('aria-valuenow', '15');

  // Test Copy Summary button
  const copyBtn = page.getByRole('button', { name: /Copy summary/i });
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  const copiedText = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText).toContain('Bill Amount: 100.00€');
  expect(copiedText).toContain('Tip (15%): 15.00€');
  expect(copiedText).toContain('Total: 115.00€');
  expect(copiedText).toContain('Per person: 57.50€');

  // Clear mock clipboard
  await page.evaluate(() => { (window as any).clipboardText = ''; });

  // Test Reset via Escape key
  await page.keyboard.press('Escape');

  // Verify reset and focus restored to #bill-amount
  await expect(billInput).toHaveValue('');
  await expect(billInput).toBeFocused();

  toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  // Refill bill input and test 'C' shortcut when not focused on an input
  await billInput.fill('50.00');
  await billInput.blur();
  await page.keyboard.press('c');

  toastNotification = page.locator('[data-sonner-toast]').last();
  await expect(toastNotification).toBeVisible();

  const copiedText2 = await page.evaluate(() => (window as any).clipboardText);
  expect(copiedText2).toContain('Bill Amount: 50.00€');

  // Switch to French route
  await page.goto('http://localhost:5173/fr/outil/tip-calculator');

  // Verify French translation
  const billLabelFr = page.locator('label[for="bill-amount"]');
  await expect(billLabelFr).toContainText("Montant de l'addition");

  const casualPresetBtnFr = page.getByRole('button', { name: 'Dîner Classique (15% pourboire, 2 pers.)' });
  await expect(casualPresetBtnFr).toBeVisible();
});
