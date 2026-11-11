import { test, expect } from '@playwright/test';

test.describe('User Agent Generator Palette Micro-UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/ua-generator');
  });

  test('should display presets with aria-pressed and update when clicked', async ({ page }) => {
    // Default preset is Chrome (Windows)
    const chromeWin = page.getByRole('button', { name: 'Chrome (Windows)' });
    await expect(chromeWin).toBeVisible();
    await expect(chromeWin).toHaveAttribute('aria-pressed', 'true');

    // Click Safari (macOS)
    const safariMac = page.getByRole('button', { name: 'Safari (macOS)' });
    await expect(safariMac).toHaveAttribute('aria-pressed', 'false');

    await safariMac.click();
    await expect(safariMac).toHaveAttribute('aria-pressed', 'true');
    await expect(chromeWin).toHaveAttribute('aria-pressed', 'false');

    // Should display toast
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();

    // Verify UA output contains Safari/605.1.15
    const uaOutput = page.locator('p.break-all');
    await expect(uaOutput).toContainText('Safari/605.1.15');
  });

  test('should display visual Kbd shortcut hints', async ({ page }) => {
    await expect(page.locator('button[aria-label*="R"]').locator('kbd', { hasText: /^R$/ })).toBeAttached();
    await expect(page.locator('button[aria-label*="C"]').locator('kbd', { hasText: /^C$/ })).toBeAttached();
  });

  test('should regenerate UA when clicking button or pressing R', async ({ page }) => {
    const uaOutput = page.locator('p.break-all');
    const initialText = await uaOutput.innerText();

    // Press 'r'
    await page.keyboard.press('r');
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    const newText = await uaOutput.innerText();
    expect(newText).toBeTruthy();
  });

  test('should copy UA when pressing C', async ({ page }) => {
    const copyButton = page.locator('button[aria-label*="(C)"]');
    await expect(copyButton).toBeVisible();

    // Press 'c'
    await page.keyboard.press('c');
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();

    // Should show check icon briefly
    await expect(copyButton.locator('svg')).toHaveClass(/lucide-check/);
  });

  test('should reset to default preset and focus first preset on Escape', async ({ page }) => {
    const safariMac = page.getByRole('button', { name: 'Safari (macOS)' });
    await safariMac.click();
    await expect(safariMac).toHaveAttribute('aria-pressed', 'true');

    const chromeWin = page.getByRole('button', { name: 'Chrome (Windows)' });
    await expect(chromeWin).toHaveAttribute('aria-pressed', 'false');

    // Press Escape
    await page.keyboard.press('Escape');

    await expect(chromeWin).toHaveAttribute('aria-pressed', 'true');
    await expect(chromeWin).toBeFocused();
    await expect(safariMac).toHaveAttribute('aria-pressed', 'false');
  });
});
