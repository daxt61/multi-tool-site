import { test, expect } from '@playwright/test';

test.describe('AnsiEscapeStripper UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Go to French path for the tool
    await page.goto('http://localhost:5173/fr/outil/ansi-escape-stripper');
  });

  test('should load default input and process stripped output', async ({ page }) => {
    const inputTextArea = page.locator('#ansi-input');
    const outputTextArea = page.locator('#ansi-output');

    // Default value check
    await expect(inputTextArea).toHaveValue('\\x1b[31mHello\\x1b[0m \\x1b[4mWorld\\x1b[0m');
    await expect(outputTextArea).toHaveValue('Hello World');
  });

  test('should load quick presets and set aria-pressed state', async ({ page }) => {
    const inputTextArea = page.locator('#ansi-input');
    const outputTextArea = page.locator('#ansi-output');

    // Click 'Git Diff' preset
    const gitDiffPreset = page.getByRole('button', { name: 'Git Diff' });
    await expect(gitDiffPreset).toBeVisible();
    await gitDiffPreset.click();

    // Verify aria-pressed and focus
    await expect(gitDiffPreset).toHaveAttribute('aria-pressed', 'true');
    await expect(inputTextArea).toBeFocused();
    await expect(outputTextArea).toHaveValue('+ const user = await fetchUser(id);\n- const user = getUserSync(id);');
  });

  test('should toggle mode buttons with aria-pressed state', async ({ page }) => {
    const stripAllBtn = page.getByRole('button', { name: /Tout supprimer/i });
    const colorsOnlyBtn = page.getByRole('button', { name: /Couleurs\/Styles uniquement/i });

    await expect(stripAllBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(colorsOnlyBtn).toHaveAttribute('aria-pressed', 'false');

    await colorsOnlyBtn.click();
    await expect(stripAllBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(colorsOnlyBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should clear inputs and focus input textarea when Escape is pressed on input', async ({ page }) => {
    const inputTextArea = page.locator('#ansi-input');
    await inputTextArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputTextArea).toHaveValue('');
    await expect(inputTextArea).toBeFocused();
  });

  test('should copy output and show success state when C is pressed', async ({ page }) => {
    const inputTextArea = page.locator('#ansi-input');
    await inputTextArea.fill('\\x1b[32mIntegration Success\\x1b[0m');

    const outputTextArea = page.locator('#ansi-output');
    await expect(outputTextArea).toHaveValue('Integration Success');

    // Focus input and blur to trigger container shortcut 'C'
    await inputTextArea.focus();
    await inputTextArea.blur();

    // Click container area to focus within container, then press 'c'
    await page.locator('#ansi-output').click();
    await page.keyboard.press('c');

    // Copy button should show check icon
    const copyButton = page.locator('button:has(svg.lucide-copy), button:has(svg.lucide-check)').first();
    await expect(copyButton.locator('svg')).toHaveClass(/lucide-check/);
  });

  test('should display visual keyboard shortcut hints (Kbd)', async ({ page }) => {
    await expect(page.locator('kbd', { hasText: /^Esc$/ })).toBeVisible();
    await expect(page.locator('kbd', { hasText: /^C$/ })).toBeVisible();
  });
});
