import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: 'verification/videos',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  try {
    // Navigate to Chmod Calculator
    await page.goto('http://localhost:5173/en/outil/chmod');
    await page.waitForTimeout(1000);

    // Click some permissions
    const firstButton = page.locator('.space-y-3 button').first();
    await firstButton.click();
    await page.waitForTimeout(500);

    const secondButton = page.locator('.space-y-3 button').nth(1);
    await secondButton.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'verification/screenshots/chmod_verification.png' });
    await page.waitForTimeout(1000);

    // Click clear
    const clearButton = page.locator('button:has-text("Clear all"), button:has-text("Effacer tout")').first();
    await clearButton.click();
    await page.waitForTimeout(1000);

  } catch (error) {
    console.error('Playwright verification script failed:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

run();
