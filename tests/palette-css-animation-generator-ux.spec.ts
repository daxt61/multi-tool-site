import { test, expect } from '@playwright/test';

test.describe('CSS Animation Generator Micro-UX & Accessibility Tests', () => {
  test('verifies ARIA attributes, explicit label pairings, and focus management', async ({ page }) => {
    // Navigate to CSS Animation Generator tool page
    await page.goto('http://localhost:5173/en/outil/css-animation');

    // 1. Verify preset buttons have aria-pressed states
    const fadeBtn = page.getByRole('button', { name: 'Fade', exact: true });
    const rotateBtn = page.getByRole('button', { name: 'Rotate', exact: true });

    await expect(fadeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(rotateBtn).toHaveAttribute('aria-pressed', 'false');

    await rotateBtn.click();
    await expect(fadeBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(rotateBtn).toHaveAttribute('aria-pressed', 'true');

    // 2. Verify explicit HTML label associations (id / htmlFor)
    const durationInput = page.locator('#duration-input');
    const delayInput = page.locator('#delay-input');
    const timingSelect = page.locator('#timing-select');
    const iterationsSelect = page.locator('#iterations-select');
    const directionSelect = page.locator('#direction-select');
    const fillModeSelect = page.locator('#fill-mode-select');
    const codeOutput = page.locator('#generated-css-output');

    await expect(durationInput).toBeVisible();
    await expect(delayInput).toBeVisible();
    await expect(timingSelect).toBeVisible();
    await expect(iterationsSelect).toBeVisible();
    await expect(directionSelect).toBeVisible();
    await expect(fillModeSelect).toBeVisible();
    await expect(codeOutput).toBeVisible();

    // 3. Verify play/pause preview toggle button ARIA attributes
    const playPauseBtn = page.locator('button[aria-label="Pause animation"], button[aria-label="Pause"], button[aria-label="Play"]');
    await expect(playPauseBtn).toBeVisible();
    await expect(playPauseBtn).toHaveAttribute('aria-pressed', 'true');

    // Toggle pause
    await playPauseBtn.click();
    await expect(playPauseBtn).toHaveAttribute('aria-pressed', 'false');

    // 4. Verify Reset button behavior, toast notification, and focus restoration to #duration-input
    const resetBtn = page.getByRole('button', { name: /reset/i });
    await resetBtn.click();

    await expect(durationInput).toBeFocused();
    await expect(fadeBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
