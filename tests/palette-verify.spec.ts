import { test, expect } from '@playwright/test';

test('verify calculator accessibility and dashboard scroll', async ({ page }) => {
  // 1. Verify Calculator Accessibility and Interactions
  await page.goto('http://localhost:5173/en/outil/calculator');

  // Check ARIA labels on buttons
  const backspaceBtn = page.getByLabel('Backspace');
  await expect(backspaceBtn).toBeVisible();

  const equalsBtn = page.getByLabel('Equals');
  await expect(equalsBtn).toBeVisible();

  // Check display aria-live
  const display = page.locator('[aria-live="polite"]').first();
  await expect(display).toBeVisible();
  await expect(display).toContainText('0');

  // Verify keyboard visual feedback (activeBtn state)
  await page.keyboard.down('7');
  const btn7 = page.getByRole('button', { name: '7', exact: true });
  await expect(btn7).toHaveClass(/ring-4/);
  await page.keyboard.up('7');
  await expect(btn7).not.toHaveClass(/ring-4/);

  // 2. Verify Dashboard Scroll-to-Top
  await page.goto('http://localhost:5173/en');

  // Scroll down a bit
  await page.evaluate(() => window.scrollTo(0, 1000));
  let scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(0);

  // Click a category
  await page.getByRole('button', { name: 'Finance' }).click();

  // Verify scroll is back at 0
  await page.waitForFunction(() => window.scrollY === 0);
  scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);

  // Capture screenshot of calculator with highlighted button
  await page.goto('http://localhost:5173/en/outil/calculator');
  await page.keyboard.down('5');
  await page.screenshot({ path: 'verification/screenshots/calculator_shortcut.png' });
});
