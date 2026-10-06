import { test, expect } from '@playwright/test';

test.describe('Subnet Calculator Palette Micro-UX & Accessibility', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto('http://localhost:5173/en/outil/subnet-calculator');
  });

  test('interactive presets update inputs and aria-pressed attributes', async ({ page }) => {
    const corpPreset = page.getByRole('button', { name: 'Corporate LAN (/16)' });
    await expect(corpPreset).toBeVisible();
    await expect(corpPreset).toHaveAttribute('aria-pressed', 'false');

    await corpPreset.click();
    await expect(corpPreset).toHaveAttribute('aria-pressed', 'true');

    // Verify IP input updated
    const ipInput = page.locator('#ip-input');
    await expect(ipInput).toHaveValue('10.0.0.1');

    // Verify CIDR slider updated
    const cidrSlider = page.locator('#cidr-input');
    await expect(cidrSlider).toHaveValue('16');
    await expect(cidrSlider).toHaveAttribute('aria-valuenow', '16');
  });

  test('range slider has explicit ARIA attributes', async ({ page }) => {
    const cidrSlider = page.locator('#cidr-input');
    await expect(cidrSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(cidrSlider).toHaveAttribute('aria-valuemax', '32');
    await expect(cidrSlider).toHaveAttribute('aria-valuenow', '24');
    await expect(cidrSlider).toHaveAttribute('aria-label', 'CIDR Mask');
  });

  test('reset button restores focus to IP input and triggers toast', async ({ page }) => {
    // Change IP value
    const ipInput = page.locator('#ip-input');
    await ipInput.fill('172.16.10.5');

    // Click Reset
    const resetButton = page.getByRole('button', { name: 'Reset' });
    await resetButton.click();

    // Verify reset values
    await expect(ipInput).toHaveValue('192.168.1.1');
    await expect(ipInput).toBeFocused();

    // Toast should appear
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();
  });

  test('keyboard shortcuts Escape resets tool and C copies network address', async ({ page }) => {
    const ipInput = page.locator('#ip-input');
    await ipInput.fill('10.20.30.40');

    // Press Escape inside input to reset
    await ipInput.press('Escape');
    await expect(ipInput).toHaveValue('192.168.1.1');
    await expect(ipInput).toBeFocused();

    // Blur input by clicking container header
    await page.locator('h3').first().click();

    // Press C to copy network address
    await page.keyboard.press('c');
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible();
  });
});
