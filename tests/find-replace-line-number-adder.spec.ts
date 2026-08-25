import { test, expect } from '@playwright/test';

test.describe('FindAndReplace & LineNumberAdder Premium UX & Functionality', () => {
  test('FindAndReplace tool handles presets, options, toasts, and label pairings', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/find-replace');

    // Verify explicit label associations
    const inputArea = page.locator('#find-replace-input');
    await expect(inputArea).toBeVisible();

    const findInput = page.locator('#find-text-input');
    await expect(findInput).toBeVisible();

    const replaceInput = page.locator('#replace-text-input');
    await expect(replaceInput).toBeVisible();

    // Verify Quick Presets
    const doubleSpacesBtn = page.getByRole('button', { name: 'Fix Double Spaces' });
    await expect(doubleSpacesBtn).toBeVisible();
    await doubleSpacesBtn.click();

    // Verify input populated
    await expect(inputArea).toHaveValue('The quick brown fox jumps over the lazy  dog. Teht text has double  spaces.');
    await expect(findInput).toHaveValue('  ');
    await expect(replaceInput).toHaveValue(' ');

    // Verify replacement output
    const outputArea = page.locator('#find-replace-output');
    await expect(outputArea).toContainText('The quick brown fox jumps over the lazy dog. Teht text has double spaces.');

    // Test Markdown Link preset
    const markdownPresetBtn = page.getByRole('button', { name: 'Markdown Links to Text' });
    await markdownPresetBtn.click();
    await expect(inputArea).toHaveValue('[Documentation](https://example.com/docs) and [GitHub](https://github.com/repo)');
    await expect(outputArea).toContainText('Documentation and GitHub');

    // Test Keyboard Clear (Esc) - click body to blur active element then press Escape
    await page.locator('body').click();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
  });

  test('LineNumberAdder tool handles presets, options, padding, and label pairings', async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/line-number-adder');

    // Verify explicit label associations
    const inputArea = page.locator('#line-number-input');
    await expect(inputArea).toBeVisible();

    const startInput = page.locator('#start-num');
    await expect(startInput).toBeVisible();

    const stepInput = page.locator('#step-num');
    await expect(stepInput).toBeVisible();

    const sepInput = page.locator('#separator-str');
    await expect(sepInput).toBeVisible();

    const padInput = page.locator('#padding-width');
    await expect(padInput).toBeVisible();

    // Test Code Lines preset
    const codeLinesPreset = page.getByRole('button', { name: 'Standard Code Lines (1. )' });
    await expect(codeLinesPreset).toBeVisible();
    await codeLinesPreset.click();

    const outputArea = page.locator('#line-number-output');
    await expect(outputArea).toHaveValue('1. const a = 10;\n2. const b = 20;\n3. console.log(a + b);');

    // Test Padded Log Lines preset
    const paddedLogsPreset = page.getByRole('button', { name: 'Padded Log Lines (001: )' });
    await paddedLogsPreset.click();
    await expect(outputArea).toHaveValue('001: System initialized\n002: Connecting to database\n003: Query executed successfully\n004: Service ready');

    // Test Keyboard Clear (Esc) - click body to blur active element then press Escape
    await page.locator('body').click();
    await page.keyboard.press('Escape');
    await expect(inputArea).toHaveValue('');
  });
});
