import { test, expect } from '@playwright/test';

test('Regex Extractor Security: Prevents Replacement String Injection in Template Formatting', async ({ page }) => {
  await page.goto('http://localhost:5173/en/outil/regex-extractor');

  const patternInput = page.locator('#extractor-pattern-input');
  const textInput = page.locator('#extractor-text-input');
  const textOutput = page.locator('#extractor-text-output');

  await expect(patternInput).toBeVisible();
  await expect(textInput).toBeVisible();
  await expect(textOutput).toBeVisible();

  // Test case: Extract values containing $1, $&, $', $`, and $$
  const testInput = 'price=$100;code=$&;item=$`rest;token=$$val';
  await textInput.fill(testInput);

  // Set pattern with named capture groups 'key' and 'value'
  await patternInput.fill('(?<key>\\w+)=(?<value>[^;\\s]+)');

  // Ensure 'Format Template' mode is selected
  const templateBtn = page.getByRole('button', { name: 'Format Template', exact: true });
  await templateBtn.click();

  // Set replacement template to: $<key> = $<value>
  const templateInput = page.locator('#template-format-input');
  await templateInput.fill('$<key> = $<value>');

  // Verify that the output literally contains the exact extracted values without replacement pattern expansion
  await expect(textOutput).toHaveValue(/price = \$100/);
  await expect(textOutput).toHaveValue(/code = \$\&/);
  await expect(textOutput).toHaveValue(/item = \$\`rest/);
  await expect(textOutput).toHaveValue(/token = \$\s*\$val/);

  // Check full output text for exact match strings
  const outputText = await textOutput.inputValue();
  expect(outputText).toContain('price = $100');
  expect(outputText).toContain('code = $&');
  expect(outputText).toContain('item = $`rest');
  expect(outputText).toContain('token = $$val');
});
