import { test, expect } from '@playwright/test';

test.describe('CSS Specificity Calculator E2E Tests', () => {
  test('should load, handle presets, calculate scores, sort, and handle keyboard shortcuts', async ({ page }) => {
    // 1. Go to the CSS Specificity page
    await page.goto('http://localhost:5173/en/outil/css-specificity');

    // 2. Assert page loads correct title
    await expect(page.locator('h1')).toContainText('CSS Selector Specificity');

    // 3. Verify the main input element exists and holds default value
    const inputTextArea = page.locator('#selectors-input');
    await expect(inputTextArea).toBeVisible();
    await expect(inputTextArea).toContainText('header .navigation li a:hover');

    // 4. Check if some specificity scores are rendered by default
    await expect(page.locator('text=Specificity Breakdown')).toBeVisible();
    await expect(page.locator('div.font-mono', { hasText: 'header .navigation li a:hover' }).first()).toBeVisible();

    // 5. Test Quick Preset loading
    const basicPresetButton = page.locator('text="Basic Layout"');
    await expect(basicPresetButton).toBeVisible();
    await basicPresetButton.click();

    // Verify preset loaded and input updated
    await expect(inputTextArea).toHaveValue('body\nheader\n#logo\n.nav-item\nmain section p');

    // 6. Test Specificity Calculations after loading preset
    // body has score (0, 0, 1)
    await expect(page.locator('div.font-mono', { hasText: 'body' }).first()).toBeVisible();
    await expect(page.locator('text="(0, 0, 1)"').first()).toBeVisible();

    // #logo has score (1, 0, 0)
    await expect(page.locator('div.font-mono', { hasText: '#logo' }).first()).toBeVisible();
    await expect(page.locator('text="(1, 0, 0)"').first()).toBeVisible();

    // 7. Verify Cascade Priority sorting
    // By default, sorting is "cascade", so #logo (1, 0, 0) should be at the top
    const selectorCards = page.locator('div.grid-cols-3').locator('..');
    const firstCardText = await selectorCards.nth(0).locator('div.font-mono').first().textContent();
    expect(firstCardText?.trim()).toBe('#logo');

    // Switch sort order to "As Entered"
    const asEnteredButton = page.locator('text="As Entered"');
    await asEnteredButton.click();

    // Now, the first element should be "body" as entered in the preset
    const firstCardTextAsEntered = await selectorCards.nth(0).locator('div.font-mono').first().textContent();
    expect(firstCardTextAsEntered?.trim()).toBe('body');

    // 8. Test Clear / Reset action
    const clearButton = page.locator('text="Clear"');
    await clearButton.click();
    await expect(inputTextArea).toHaveValue('');

    // Check empty state message is shown
    await expect(page.locator('text="Enter selectors to calculate specificity..."')).toBeVisible();

    // 9. Enter custom selector and verify calculations
    await inputTextArea.fill('div.active:hover::after');
    await expect(page.locator('text="(0, 2, 2)"')).toBeVisible(); // .active, :hover = 2 (B), div = 1 (C), ::after = 1 (C) -> (0, 2, 2)

    // 10. Test Keyboard Shortcut: Esc clears input and focuses textarea
    // Fill text first
    await inputTextArea.fill('hello-world');
    await page.keyboard.press('Escape');
    await expect(inputTextArea).toHaveValue('');
    await expect(inputTextArea).toBeFocused();
  });
});
