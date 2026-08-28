import { test, expect } from '@playwright/test';

test.describe('HexToImage Tool UX & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/fr/outil/hex-to-image');
  });

  test('renders explicit HTML label associations and Kbd shortcut badge', async ({ page }) => {
    const inputTextArea = page.locator('#hex-input');
    await expect(inputTextArea).toBeVisible();

    const widthInput = page.locator('#hex-width');
    await expect(widthInput).toBeVisible();
    const widthLabel = page.locator('label[for="hex-width"]');
    await expect(widthLabel).toBeVisible();

    const scaleInput = page.locator('#hex-pixel-size');
    await expect(scaleInput).toBeVisible();
    const scaleLabel = page.locator('label[for="hex-pixel-size"]');
    await expect(scaleLabel).toBeVisible();

    const escBadge = page.getByText('Esc');
    await expect(escBadge).toBeVisible();
  });

  test('loads preset and updates image rendering', async ({ page }) => {
    const rgbPresetBtn = page.getByRole('button', { name: 'Carré RGB 3x3' });
    await expect(rgbPresetBtn).toBeVisible();
    await rgbPresetBtn.click();

    const inputTextArea = page.locator('#hex-input');
    await expect(inputTextArea).toHaveValue('ff0000 00ff00 0000ff 00ffff ff00ff ffff00 000000 ffffff 808080');

    const widthInput = page.locator('#hex-width');
    await expect(widthInput).toHaveValue('3');

    const canvas = page.locator('canvas[aria-label="Generated Hex Image Canvas"]');
    await expect(canvas).toBeVisible();

    await expect(page.getByText('Préréglage appliqué !')).toBeVisible();
  });

  test('resets state and restores focus on Escape keypress', async ({ page }) => {
    const inputTextArea = page.locator('#hex-input');
    await inputTextArea.fill('ff0000 00ff00');

    await inputTextArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputTextArea).toHaveValue('');
    await expect(inputTextArea).toBeFocused();
    await expect(page.getByText('Saisies effacées et focus restauré !')).toBeVisible();
  });
});
