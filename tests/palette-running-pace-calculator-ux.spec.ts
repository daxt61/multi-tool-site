import { test, expect } from '@playwright/test';

test.describe('RunningPaceCalculator Palette Micro-UX & Accessibility Suite', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('should load quick presets, update distance and unit, and set aria-pressed state', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/running-pace');
    await page.waitForSelector('#distance-input');

    // 5K is initially active by default
    const preset5k = page.getByRole('button', { name: '5K', exact: true });
    await expect(preset5k).toBeVisible();
    await expect(preset5k).toHaveAttribute('aria-pressed', 'true');

    // Click Half Marathon preset
    const presetHalf = page.getByRole('button', { name: 'Half Marathon' });
    await presetHalf.click();

    await expect(presetHalf).toHaveAttribute('aria-pressed', 'true');
    await expect(preset5k).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#distance-input')).toHaveValue('21.0975');
    await expect(page.locator('#unit-select')).toHaveValue('km');
    await expect(page.getByText('Distance preset applied').first()).toBeVisible();

    // Click 5 Miles preset
    const preset5mi = page.getByRole('button', { name: '5 Miles' });
    await preset5mi.click();

    await expect(preset5mi).toHaveAttribute('aria-pressed', 'true');
    await expect(presetHalf).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#distance-input')).toHaveValue('5');
    await expect(page.locator('#unit-select')).toHaveValue('mi');
  });

  test('should clear active preset selection when inputs or units are manually edited', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/running-pace');
    await page.waitForSelector('#distance-input');

    const preset10k = page.getByRole('button', { name: '10K', exact: true });
    await preset10k.click();
    await expect(preset10k).toHaveAttribute('aria-pressed', 'true');

    // Editing distance clears active preset
    await page.locator('#distance-input').fill('12');
    await expect(preset10k).toHaveAttribute('aria-pressed', 'false');

    // Reactivate preset
    await preset10k.click();
    await expect(preset10k).toHaveAttribute('aria-pressed', 'true');

    // Editing unit clears active preset
    await page.locator('#unit-select').selectOption('mi');
    await expect(preset10k).toHaveAttribute('aria-pressed', 'false');
  });

  test('should trigger reset action and restore focus to #distance-input via Escape shortcut', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/running-pace');
    await page.waitForSelector('#distance-input');

    const preset10k = page.getByRole('button', { name: '10K', exact: true });
    await preset10k.click();
    await page.locator('#time-hours').fill('1');

    // Focus input inside container before hitting Escape
    await page.locator('#time-hours').focus();
    await page.keyboard.press('Escape');

    await expect(page.locator('#distance-input')).toHaveValue('5');
    await expect(page.locator('#unit-select')).toHaveValue('km');
    await expect(page.locator('#time-hours')).toHaveValue('0');
    await expect(page.locator('#time-minutes')).toHaveValue('25');
    await expect(page.locator('#time-seconds')).toHaveValue('0');
    await expect(page.locator('#distance-input')).toBeFocused();
    await expect(page.getByText('Values reset to default').first()).toBeVisible();
  });

  test('should allow copying pace summary via Copy Summary button and "C" hotkey when unfocused', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/running-pace');
    await page.waitForSelector('#distance-input');

    const copyBtn = page.getByRole('button', { name: 'Copy Summary' });
    await expect(copyBtn).toBeVisible();

    await copyBtn.click();
    await expect(page.getByText('Pace summary copied to clipboard').first()).toBeVisible();

    // Hotkey C when unfocused (blur active input)
    await page.locator('#distance-input').blur();
    await page.keyboard.press('c');
    await expect(page.getByText('Pace summary copied to clipboard').first()).toBeVisible();
  });
});
