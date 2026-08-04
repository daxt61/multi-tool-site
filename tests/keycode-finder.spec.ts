import { test, expect } from '@playwright/test';

test.describe('KeyCodeFinder and HashGenerator Premium E2E tests', () => {

  test('KeyCodeFinder should render and capture key events', async ({ page }) => {
    // Go to KeyCodeFinder path
    await page.goto('http://localhost:5173/fr/outil/keycode-finder');

    // Check initial prompt is visible
    await expect(page.locator('h2')).toContainText('Appuyez sur n\'importe quelle touche');

    // Simulate keyboard event press
    await page.keyboard.press('a');

    // Verify properties table is rendered with exact key elements
    await expect(page.locator('text=event.key').nth(1)).toBeVisible();
    await expect(page.locator('text=event.code').nth(1)).toBeVisible();
    await expect(page.locator('text=event.keyCode').nth(1)).toBeVisible();

    // Verify key detection displays 'a' and corresponding standard keyCode
    await expect(page.locator('text=event.key = "a"')).toBeVisible();
    await expect(page.locator('text=event.code = "KeyA"')).toBeVisible();

    // Switch tabs to Snippets
    await page.click('text=Extraits de Code');
    await expect(page.locator('text=document.addEventListener')).toBeVisible();

    // Switch to History tab
    await page.click('text=Historique');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('td:has-text("KeyA")')).toBeVisible();
  });

  test('HashGenerator should support file mode and casing adjustments', async ({ page }) => {
    // Go to HashGenerator path
    await page.goto('http://localhost:5173/fr/outil/hash-generator');

    // Fill text into input
    await page.fill('textarea#hash-input', 'boite-a-outils');

    // Find the specific container for SHA-256 (it contains "SHA-256" span)
    const sha256Block = page.locator('div:has(> div > span:has-text("SHA-256"))').first();
    await expect(sha256Block).toBeVisible();

    // The hash text value is within the nested div inside the block
    const sha256Text = await sha256Block.locator('div.font-mono').textContent();
    expect(sha256Text).toMatch(/^[0-9a-f]{64}$/); // Hex lowercase

    // Toggle casing modifier to uppercase
    await page.click('text=MAJUSCULES');
    const sha256TextUpper = await sha256Block.locator('div.font-mono').textContent();
    expect(sha256TextUpper).toMatch(/^[0-9A-F]{64}$/); // Hex uppercase

    // Switch to File mode
    await page.click('text=Fichier');
    await expect(page.locator('text=Glissez-déposez')).toBeVisible();
  });

});
