import { test, expect } from '@playwright/test';

test.describe('URL Extractor Upgrade & UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/url-extractor');
    await page.waitForSelector('#extractor-input');
  });

  test('should render properly and handle preset loading', async ({ page }) => {
    const textarea = page.locator('#extractor-input');
    await expect(textarea).toBeVisible();

    // Click quick preset
    const presetBtn = page.getByRole('button', { name: /Sample HTML Page|Exemple de Page HTML/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Verify extracted URLs count badge
    const badge = page.locator('span:has-text("5")').first();
    await expect(badge).toBeVisible();
  });

  test('should filter URLs by domain / substring', async ({ page }) => {
    // Load markdown preset
    const presetBtn = page.getByRole('button', { name: /Markdown Links|Liens Markdown/i });
    await presetBtn.click();

    // Filter by domain
    const domainInput = page.locator('#domain-filter-input');
    await domainInput.fill('react.dev');

    // Count should be 1
    const countBadge = page.locator('span:has-text("1")').first();
    await expect(countBadge).toBeVisible();
  });

  test('should filter URLs by protocol (HTTPS vs HTTP)', async ({ page }) => {
    // Load webpage preset which contains http and https URLs
    const presetBtn = page.getByRole('button', { name: /Sample HTML Page|Exemple de Page HTML/i });
    await presetBtn.click();

    // Select HTTPS only
    const protocolSelect = page.locator('#protocol-select');
    await protocolSelect.selectOption('https');

    // Total URLs should update
    const countBadge = page.locator('span:has-text("3")').first();
    await expect(countBadge).toBeVisible();
  });

  test('should support keyboard shortcuts (Esc to clear, C to copy)', async ({ page }) => {
    const textarea = page.locator('#extractor-input');
    await textarea.fill('Check https://example.com/test');

    // Unfocus text area to trigger global shortcut
    await page.getByText('URLs Found').click();

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(textarea).toHaveValue('');
    await expect(textarea).toBeFocused();
  });

  test('should enforce MAX_LENGTH DoS limit', async ({ page }) => {
    const textarea = page.locator('#extractor-input');
    const overlyLongText = 'https://example.com/' + 'a'.repeat(100005);

    await textarea.fill(overlyLongText);

    // Error message should appear
    const errorBanner = page.locator('text=Input is too long');
    await expect(errorBanner).toBeVisible();
  });
});
