import { test, expect } from '@playwright/test';

test('verify back to top button visibility', async ({ page }) => {
  await page.goto('http://localhost:5173/en');

  // Initially hidden
  const backToTop = page.locator('button[aria-label="Back to Top"]');
  await expect(backToTop).toHaveClass(/opacity-0/);

  // Scroll down
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(500);

  // Now visible
  await expect(backToTop).toHaveClass(/opacity-100/);
  await page.screenshot({ path: 'verification/back_to_top.png' });

  // Click and check scroll
  await backToTop.click();
  await page.waitForTimeout(1000);
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeLessThan(100);
});

test('verify case converter new styles', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/case-converter');
  await page.fill('#case-text', 'Hello World 123');
  await page.waitForTimeout(1000);

  const strikethrough = page.locator('div.group', { has: page.locator('span:has-text("Strikethrough")') }).locator('div.font-mono');
  await expect(strikethrough).toContainText('H̶e̶l̶l̶o̶ ̶W̶o̶r̶l̶d̶ ̶1̶2̶3̶');

  const bubble = page.locator('div.group', { has: page.locator('span:has-text("Bubble")') }).locator('div.font-mono');
  await expect(bubble).toContainText('Ⓗⓔⓛⓛⓞ Ⓦⓞⓡⓛⓓ ①②③');

  await page.screenshot({ path: 'verification/case_styles.png' });
});

test('verify regex quick help toggle', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/regex-tester');

  await expect(page.locator('text=Word boundary')).not.toBeVisible();

  await page.click('button:has-text("More")');
  await expect(page.locator('text=Word boundary')).toBeVisible();

  await page.screenshot({ path: 'verification/regex_help.png' });
});

test('verify morse visual signaling', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/morse-code');
  await page.fill('#normal-text', 'S'); // '...'

  const indicator = page.locator('div.rounded-full.border-4');
  await page.click('button:has-text("Play")');

  // Indicator should light up at least once during playback
  await expect(indicator).toHaveClass(/bg-indigo-500/, { timeout: 5000 });
  await page.screenshot({ path: 'verification/morse_visual.png' });
});
