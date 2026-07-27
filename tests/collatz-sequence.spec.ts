import { test, expect } from '@playwright/test';

test('Collatz Sequence functionality and UX', async ({ page, baseURL }) => {
  // Navigate to English version of the tool
  await page.goto(`${baseURL || 'http://localhost:5173'}/en/outil/collatz-sequence`);

  const startInput = page.locator('#start-number-input');
  const maxIterationsInput = page.locator('#max-iterations-input');
  const outputArea = page.locator('#collatz-output');

  // Verify elements exist
  await expect(startInput).toBeVisible();
  await expect(maxIterationsInput).toBeVisible();
  await expect(outputArea).toBeVisible();

  // Test Case 1: Validate default Collatz progression for starting number 27
  // n = 27 starts: 27 -> 82 -> 41 -> 124 -> 62 ...
  await expect(startInput).toHaveValue('27');
  await expect(outputArea).toHaveValue(/27 → 82 → 41 → 124/);

  // Test Case 2: Change starting number
  // n = 5: 5 -> 16 -> 8 -> 4 -> 2 -> 1 (Steps = 5, Peak = 16)
  await startInput.fill('');
  await startInput.fill('5');
  await expect(outputArea).toHaveValue('5 → 16 → 8 → 4 → 2 → 1');

  // Check stats details
  const stepsStat = page.locator('div').filter({ hasText: /^Total Steps$/ }).locator('..').locator('.font-mono');
  const peakStat = page.locator('div').filter({ hasText: /^Peak Value$/ }).locator('..').locator('.font-mono');
  await expect(stepsStat).toHaveText('5');
  await expect(peakStat).toHaveText('16');

  // Test Case 3: Test alternate delimiter formats
  // Select space format
  const spaceButton = page.locator('button:has-text("Space")');
  await spaceButton.click();
  await expect(outputArea).toHaveValue('5 16 8 4 2 1');

  // Select comma format
  const commaButton = page.locator('button:has-text("Comma")');
  await commaButton.click();
  await expect(outputArea).toHaveValue('5, 16, 8, 4, 2, 1');

  // Test Case 4: Verify SVG line chart elements exist
  const svgChart = page.locator('svg[aria-label="Collatz trajectory path graph"]');
  await expect(svgChart).toBeVisible();
  // Line or area points must be present
  const pathElement = svgChart.locator('path').first();
  await expect(pathElement).toBeVisible();

  // Test Case 5: Keyboard Shortcuts - Escape to clear and reset input
  await startInput.focus();
  await page.keyboard.press('Escape');
  // Since "Escape" triggers handleClear, it resets to default START_NUMBER "27" and focuses input
  await expect(startInput).toHaveValue('27');
  await expect(startInput).toBeFocused();

  // Test Case 6: Copy keyboard shortcut when unfocused
  await startInput.blur();
  await page.keyboard.press('c');

  // Verify copy button is visible and works
  const copyBtn = page.locator('button:has-text("Copy")');
  await expect(copyBtn).toBeVisible();
});
