import { test, expect } from '@playwright/test';

test.describe('List Zipper & Unzipper Tool E2E tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the list zipper tool URL path on localhost
    await page.goto('http://localhost:5173/en/outil/list-zipper-unzipper');
  });

  test('should combine list A and list B correctly with default comma separator (Zip mode)', async ({ page }) => {
    // Ensure Zip view tab is open
    await expect(page.locator('text=Combine Parameters')).toBeVisible();

    // Fill List A & List B textareas
    await page.fill('#zip-list-a', 'Apple\nBanana\nOrange');
    await page.fill('#zip-list-b', 'Red\nYellow\nOrange');

    // Result should automatically combine line-by-line using standard comma separator
    const output = page.locator('#zip-output');
    await expect(output).toHaveValue('Apple, Red\nBanana, Yellow\nOrange, Orange', { timeout: 3000 });

    // Let's test with exact standard values to be certain
    await page.fill('#zip-list-a', '1\n2\n3');
    await page.fill('#zip-list-b', 'A\nB\nC');
    await expect(output).toHaveValue('1, A\n2, B\n3, C');
  });

  test('should handle different zipping separators', async ({ page }) => {
    await page.fill('#zip-list-a', '1\n2');
    await page.fill('#zip-list-b', 'A\nB');

    // Select semicolon separator
    await page.selectOption('#zip-sep-select', 'semicolon');
    await expect(page.locator('#zip-output')).toHaveValue('1; A\n2; B');

    // Select custom separator and fill value
    await page.selectOption('#zip-sep-select', 'custom');
    await page.fill('input[placeholder="e.g. - "]', ' === ');
    await expect(page.locator('#zip-output')).toHaveValue('1 === A\n2 === B');
  });

  test('should handle mismatch list sizes correctly (truncate and padding)', async ({ page }) => {
    await page.fill('#zip-list-a', '1\n2\n3\n4');
    await page.fill('#zip-list-b', 'A\nB');

    // Default pad mode
    await page.fill('#pad-val', 'X');
    await expect(page.locator('#zip-output')).toHaveValue('1, A\n2, B\n3, X\n4, X');

    // Change mismatch strategy to truncate
    await page.click('text=Ignore extra items');
    await expect(page.locator('#zip-output')).toHaveValue('1, A\n2, B');
  });

  test('should support custom wrappers (prefix & suffix)', async ({ page }) => {
    await page.fill('#zip-list-a', '1\n2');
    await page.fill('#zip-list-b', 'A\nB');
    await page.fill('#zip-prefix', '<<');
    await page.fill('#zip-suffix', '>>');

    await expect(page.locator('#zip-output')).toHaveValue('<<1, A>>\n<<2, B>>');
  });

  test('should switch to unzip tab and split joined list by separator', async ({ page }) => {
    // Switch to Unzip tab
    await page.click('text=Unzip / Split Lists');
    await expect(page.locator('text=Split Parameters')).toBeVisible();

    // Fill joined input without extra space
    await page.fill('#combined-list-input', 'Red,Apple\nYellow,Banana\nOrange,Orange');

    // Default separator is comma
    await expect(page.locator('#unzip-output-a')).toHaveValue('Red\nYellow\nOrange');
    await expect(page.locator('#unzip-output-b')).toHaveValue('Apple\nBanana\nOrange');
  });

  test('should handle unzip alternating lines strategy', async ({ page }) => {
    await page.click('text=Unzip / Split Lists');
    await page.fill('#combined-list-input', 'A1\nB1\nA2\nB2\nA3\nB3');

    // Click alternating option
    await page.click('text=Split lines by separator'); // Let's check: first is split lines, second is interleaved alternating lines
    await page.click('text=Interleaved alternating lines');

    await expect(page.locator('#unzip-output-a')).toHaveValue('A1\nA2\nA3');
    await expect(page.locator('#unzip-output-b')).toHaveValue('B1\nB2\nB3');
  });

  test('should restrict size limits up to 100,000 characters and throw error on overflow', async ({ page }) => {
    const hugeInput = 'A'.repeat(100001);
    await page.fill('#zip-list-a', hugeInput);

    await expect(page.locator('text=Input is too long. Limit of 100,000 characters.')).toBeVisible();
  });

  test('should support Escape key to clear fields and restore focus', async ({ page }) => {
    await page.fill('#zip-list-a', 'Some elements to clear');
    await page.press('#zip-list-a', 'Escape');

    // List A should be empty
    await expect(page.locator('#zip-list-a')).toHaveValue('');

    // Programmatic focus should be restored to list A
    await expect(page.locator('#zip-list-a')).toBeFocused();
  });
});
