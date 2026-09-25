import { test, expect } from '@playwright/test';

test.describe('Sentinel: HillCipher DoS Guard', () => {
  test('HillCipher restricts input length to MAX_LENGTH to prevent DoS', async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/hill-cipher');

    const inputArea = page.locator('#hill-input');
    await expect(inputArea).toBeVisible();

    // Input normal text
    await inputArea.fill('HELLOMATRIX');
    const outputArea = page.locator('#hill-output');
    await expect(outputArea).not.toHaveValue('');

    // Input excessively long text (> 100,000 characters)
    const longText = 'A'.repeat(100001);
    await inputArea.fill(longText);

    // Verify error alert is displayed and output is cleared
    const errorAlert = page.locator('div:has-text("trop long")');
    await expect(errorAlert).toBeVisible();
    await expect(outputArea).toHaveValue('');
  });
});
