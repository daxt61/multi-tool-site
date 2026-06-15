import { test, expect } from '@playwright/test';

test('Date Calculator UX: context-aware shortcuts and hints', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/date-calculator');

  await page.fill('#date1', '1990-01-01');
  await page.fill('#date2', '2020-01-01');
  await page.fill('#days-offset', '45');

  await page.evaluate(() => {
    (window as any).clipboardText = "";
    navigator.clipboard.writeText = async (text) => {
      (window as any).clipboardText = text;
    };
  });

  // Check section 1
  await page.click('text=Difference between two dates');
  await page.keyboard.press('c');
  let text = await page.evaluate(() => (window as any).clipboardText);
  expect(text).toMatch(/30Y 0m 0d/);

  // Check section 2
  await page.click('text=Add or subtract time');
  // Trigger update manually if needed by clicking something else
  await page.evaluate(() => { (window as any).clipboardText = "waiting"; });
  await page.keyboard.press('c');
  await expect.poll(async () => await page.evaluate(() => (window as any).clipboardText), { timeout: 2000 }).toMatch(/1990-02-15/);

  // Visual verification
  await page.screenshot({ path: 'verification/date-calculator-ux-final.png', fullPage: true });
});
