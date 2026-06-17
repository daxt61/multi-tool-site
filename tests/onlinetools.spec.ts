import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/en/outil';

test.describe('New Online Tools Functionality', () => {
  test('Levenshtein Distance tool works', async ({ page }) => {
    await page.goto(`${BASE_URL}/levenshtein-distance`);

    await page.fill('#str1', 'kitten');
    await page.fill('#str2', 'sitting');

    await expect(page.locator('text=Levenshtein Distance').nth(0)).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible();
    const similarity = await page.textContent('text=%');
    expect(similarity).toContain('57.14');
  });

  test('Text Grep tool works', async ({ page }) => {
    await page.goto(`${BASE_URL}/text-grep`);

    await page.fill('textarea >> nth=0', 'apple\nbanana\ncherry');
    await page.fill('input[placeholder="Enter search text..."]', 'anana');

    // Use a more specific locator for the result area to avoid confusion with input
    const results = page.locator('.w-full.h-96.p-6.bg-slate-900');
    await expect(results).toContainText('banana');
    await expect(results).not.toContainText('apple');
  });

  test('Punycode Converter works', async ({ page }) => {
    await page.goto(`${BASE_URL}/punycode-converter`);

    await page.fill('#unicode-input', 'mañana.com');
    await page.waitForTimeout(100);
    const punyValue = await page.inputValue('#puny-input');
    expect(punyValue).toBe('xn--maana-pta.com');

    await page.fill('#puny-input', 'xn--tda.com');
    await page.waitForTimeout(100);
    const unicodeValue = await page.inputValue('#unicode-input');
    expect(unicodeValue).toBe('ü.com');
  });

  test('Playfair Cipher works', async ({ page }) => {
    await page.goto(`${BASE_URL}/playfair-cipher`);

    await page.fill('input[placeholder="SECRET"]', 'PLAYFAIR');
    await page.fill('#playfair-input', 'HELLO');

    // Matrix should contain P L A Y F
    await expect(page.locator('text=P').first()).toBeVisible();

    // Result should not be empty and should be different from input
    const resultsArea = page.locator('.w-full.h-80.p-6.bg-slate-900');
    const output = await resultsArea.textContent();
    expect(output?.length).toBeGreaterThan(0);
    expect(output).not.toBe('HELLO');
  });
});
