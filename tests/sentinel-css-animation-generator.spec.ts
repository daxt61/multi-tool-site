import { test, expect } from '@playwright/test';

test.describe('CSS Animation Generator Security & Validation Tests', () => {
  test('should clamp numeric inputs and prevent out-of-bounds duration and delay', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/css-animation');

    // Wait for the duration input
    const durationInput = page.locator('#duration-input');
    await expect(durationInput).toBeVisible();

    // Fill with huge out-of-bounds number
    await durationInput.fill('999');
    // Should clamp to max 60
    await expect(durationInput).toHaveValue('60');

    // Fill with negative/zero
    await durationInput.fill('-10');
    // Should clamp to min 0.1
    await expect(durationInput).toHaveValue('0.1');

    // Delay input
    const delayInput = page.locator('#delay-input');
    await expect(delayInput).toBeVisible();

    await delayInput.fill('500');
    await expect(delayInput).toHaveValue('60');

    await delayInput.fill('-5');
    await expect(delayInput).toHaveValue('0');
  });
});
