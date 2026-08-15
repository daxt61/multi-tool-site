import { test, expect } from '@playwright/test';

test.describe('Number Sum Calculator E2E Tests', () => {
  test('should load, extract numbers, perform sum calculations, handle presets and shortcuts', async ({ page }) => {
    // 1. Go to the Number Sum Calculator page
    await page.goto('http://localhost:5173/en/outil/number-sum-calculator');

    // 2. Assert page loads correct title
    await expect(page.locator('h1')).toContainText('Number Sum Calculator');

    // 3. Verify main container and input textarea exist
    const container = page.locator('[data-testid="number-sum-container"]');
    await expect(container).toBeVisible();

    const inputTextArea = page.locator('#number-sum-input');
    await expect(inputTextArea).toBeVisible();

    // Default initial value is 10\n20\n30\n45\n50 -> sum = 155
    await expect(page.locator('text="155"')).toBeVisible();

    // 4. Test Delimiter Mode with custom input
    await inputTextArea.fill('15\n25\n35');
    await expect(page.locator('text="75"')).toBeVisible();

    // Verify statistics grid
    await expect(page.locator('text="3"').first()).toBeVisible(); // count = 3
    await expect(page.locator('text="25"').first()).toBeVisible(); // mean = 25

    // 5. Test Smart Sum Mode (Text & Receipt Extraction)
    const smartModeBtn = page.locator('button', { hasText: 'Smart Sum (Text)' });
    await smartModeBtn.click();

    await inputTextArea.fill('Bought 3 apples for $4.50, 2 milks for $3.00, and 1 bread for $2.50.');
    // Numbers extracted: 3, 4.50, 2, 3.00, 1, 2.50 -> Sum = 16
    await expect(page.locator('text="16"')).toBeVisible();

    // 6. Test Running Sum and Sum Details Mode
    const runningSumCheckbox = page.locator('input[type="checkbox"]').first();
    await runningSumCheckbox.check();

    const runningOutputArea = page.locator('textarea[readonly]');
    await expect(runningOutputArea).toBeVisible();
    await expect(runningOutputArea).toHaveValue('3\n7.5\n9.5\n12.5\n13.5\n16');

    // Enable Sum Details
    const sumDetailsCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await sumDetailsCheckbox.check();
    await expect(runningOutputArea).toContainText('7.5 (3 + 4.5)');

    // 7. Test Quick Presets
    const decimalsPresetBtn = page.locator('button', { hasText: 'Decimals & Negatives' });
    await decimalsPresetBtn.click();

    // Preset loaded: "12.5, -4.2, 8.7, -15.0, 100.25" -> Sum = 102.25
    await expect(inputTextArea).toHaveValue('12.5, -4.2, 8.7, -15.0, 100.25');
    await expect(page.locator('text="102.25"')).toBeVisible();

    // 8. Test Clear / Reset action
    const clearButton = page.locator('button', { hasText: 'Clear' }).first();
    await clearButton.click();
    await expect(inputTextArea).toHaveValue('');
    await expect(page.locator('text="0"').first()).toBeVisible();

    // 9. Test Keyboard Shortcut: Esc clears input and focuses textarea
    await inputTextArea.fill('100\n200');
    await page.keyboard.press('Escape');
    await expect(inputTextArea).toHaveValue('');
    await expect(inputTextArea).toBeFocused();
  });
});
