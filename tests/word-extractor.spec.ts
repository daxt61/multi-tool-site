import { test, expect } from '@playwright/test';

test.describe('Word Extractor & Frequency Analyzer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/outil/word-extractor');
  });

  test('renders tool title, controls, and default preset text', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Word Extractor & Frequency Analyzer' })).toBeVisible();

    const inputArea = page.locator('#word-extractor-input');
    const outputArea = page.locator('#word-extractor-output');

    await expect(inputArea).toBeVisible();
    await expect(outputArea).toBeVisible();

    // Default sample text contains fox, jumps, quick, etc.
    const outputText = await outputArea.inputValue();
    expect(outputText).toContain('The');
    expect(outputText).toContain('quick');
    expect(outputText).toContain('fox');
  });

  test('filters words by minimum length', async ({ page }) => {
    const minLengthInput = page.locator('#min-length-input');
    await minLengthInput.fill('6');

    const outputArea = page.locator('#word-extractor-output');
    const outputText = await outputArea.inputValue();

    // Words like 'The', 'fox', 'dog' should be filtered out. 'Extracting', 'analyzing', 'researchers' should remain.
    expect(outputText).not.toContain('\nThe\n');
    expect(outputText).not.toContain('\nfox\n');
    expect(outputText).toContain('Extracting');
    expect(outputText).toContain('analyzing');
  });

  test('applies casing transformations', async ({ page }) => {
    const casingSelect = page.locator('#casing-select');
    await casingSelect.selectOption('uppercase');

    const outputArea = page.locator('#word-extractor-output');
    const outputText = await outputArea.inputValue();

    expect(outputText).toContain('QUICK');
    expect(outputText).toContain('BROWN');
    expect(outputText).toContain('FOX');
  });

  test('applies presets correctly', async ({ page }) => {
    // Click on Word Frequency List preset
    await page.getByText('Word Frequency List').click();

    const inputArea = page.locator('#word-extractor-input');
    const outputArea = page.locator('#word-extractor-output');

    await expect(inputArea).toHaveValue(/data data data analytics/);

    const outputText = await outputArea.inputValue();
    // Frequency counts should be formatted as "word (count)"
    expect(outputText).toContain('data (4)');
    expect(outputText).toContain('text (3)');
  });

  test('filters words using pattern and RegEx mode', async ({ page }) => {
    const filterInput = page.locator('#filter-text-input');
    await filterInput.fill('ing');

    const outputArea = page.locator('#word-extractor-output');
    let outputText = await outputArea.inputValue();

    expect(outputText).toContain('Extracting');
    expect(outputText).toContain('analyzing');
    expect(outputText).not.toContain('fox');

    // Toggle RegEx mode
    await page.getByRole('button', { name: 'RegEx OFF' }).click();
    await filterInput.fill('^f.*x$');

    outputText = await outputArea.inputValue();
    expect(outputText.trim()).toBe('fox');
  });

  test('clears inputs when pressing Escape or Clear button', async ({ page }) => {
    const inputArea = page.locator('#word-extractor-input');
    await inputArea.focus();
    await page.keyboard.press('Escape');

    await expect(inputArea).toHaveValue('');
    await expect(page.locator('#word-extractor-output')).toHaveValue('');
  });
});
