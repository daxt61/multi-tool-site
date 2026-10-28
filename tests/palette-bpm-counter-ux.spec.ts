import { test, expect } from '@playwright/test';

test.describe('BPM Counter Micro-UX & Accessibility', () => {
  test('should support tempo presets, aria-pressed tracking, copy shortcuts, reset focus restoration, and toasts', async ({ page }) => {
    // Navigate to BPM Counter route in English
    await page.goto('http://localhost:5173/en/outil/bpm-counter');

    // 1. Verify Page Heading and Preset Bar visibility
    await expect(page.locator('h1')).toContainText('BPM');
    const presetLabel = page.getByText('Tempo Presets:');
    await expect(presetLabel).toBeVisible();

    // 2. Select a preset (e.g., Pop / Rock 120 BPM)
    const popRockBtn = page.getByRole('button', { name: /Pop \/ Rock \(120 BPM\)/i });
    await expect(popRockBtn).toBeVisible();
    await expect(popRockBtn).toHaveAttribute('aria-pressed', 'false');

    await popRockBtn.click();

    // Verify aria-pressed turns true and toast appears
    await expect(popRockBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Loaded Pop / Rock preset (120 BPM)')).toBeVisible();

    // Check BPM display value
    const bpmDisplay = page.locator('.text-7xl.font-mono');
    await expect(bpmDisplay).toHaveText('120');

    // 3. Mock clipboard and test Copy button and 'C' hotkey
    await page.evaluate(() => {
      (window as any).clipboardText = "";
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    const copyBtn = page.getByRole('button', { name: /^Copy C$/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    await expect(page.getByText('Copied').first()).toBeVisible();
    let copiedVal = await page.evaluate(() => (window as any).clipboardText);
    expect(copiedVal).toBe('120');

    // 4. Test manual tap interaction clears active preset state
    const tapBtn = page.getByRole('button', { name: /Tap to calculate BPM/i });
    await tapBtn.click();
    await expect(popRockBtn).toHaveAttribute('aria-pressed', 'false');

    // 5. Test Reset (Escape shortcut) and focus restoration
    await page.keyboard.press('Escape');

    // Verify BPM display reset to '--'
    await expect(bpmDisplay).toHaveText('--');
    // Verify focus returned to main tap button
    await expect(tapBtn).toBeFocused();

    // 6. Test another preset (House / Dance 128 BPM) in French route
    await page.goto('http://localhost:5173/fr/outil/bpm-counter');

    const housePresetFr = page.getByRole('button', { name: /House \/ Dance \(128 BPM\)/i });
    await expect(housePresetFr).toBeVisible();
    await housePresetFr.click();

    await expect(housePresetFr).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Préréglage House / Dance chargé (128 BPM)')).toBeVisible();
    await expect(bpmDisplay).toHaveText('128');

    // Re-mock clipboard for the French route
    await page.evaluate(() => {
      (window as any).clipboardText = "";
      navigator.clipboard.writeText = async (text) => {
        (window as any).clipboardText = text;
      };
    });

    // Test 'C' keyboard shortcut when unfocused
    await page.locator('body').focus();
    await page.keyboard.press('c');

    copiedVal = await page.evaluate(() => (window as any).clipboardText);
    expect(copiedVal).toBe('128');
  });
});
