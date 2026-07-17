import { test, expect } from '@playwright/test';

test('Line Prefix/Suffix tool operates correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/line-prefix-suffix');

  // Verify elements are visible
  const inputArea = page.locator('#input-text');
  await expect(inputArea).toBeVisible();

  const prefixInput = page.locator('#pref-input');
  const suffixInput = page.locator('#suff-input');
  const outputArea = page.locator('#output-text');

  // Set inputs
  await inputArea.fill('hello\nworld');
  await prefixInput.fill('>>> ');
  await suffixInput.fill(' <<<');

  // Verify basic prefix and suffix output
  await expect(outputArea).toHaveValue('>>> hello <<<\n>>> world <<<');

  // Enable line numbering
  const numberingCheckbox = page.getByRole('checkbox', { name: /Add Line Numbers/i });
  await numberingCheckbox.check();

  // Verify numbered prefix/suffix output
  await expect(outputArea).toHaveValue('>>> 1. hello <<<\n>>> 2. world <<<');
});

test('Text Columns Aligner tool operates correctly', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/text-columns-aligner');

  // Verify elements are visible
  const inputArea = page.locator('#input-text');
  await expect(inputArea).toBeVisible();

  const selectDelimiter = page.locator('#delim-type');
  const selectMargin = page.locator('#margin-range');
  const outputArea = page.locator('#output-text');

  // Fill in raw columnar data
  await inputArea.fill('id name age\n1 Alice 20\n10 Bob 30');

  // Adjust margin to 2
  await selectMargin.fill('2');

  // Output should align perfectly
  // 'id  name   age' (width of id column is 2 because of '10', so 'id' width 2 + margin 2 = 4 space prefix for 'name')
  // Let's verify the exact value is correct
  await expect(outputArea).toHaveValue('id  name   age\n1   Alice  20 \n10  Bob    30 ');
});
