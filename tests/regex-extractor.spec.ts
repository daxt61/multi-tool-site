import { test, expect } from '@playwright/test';

test('Regex Extractor E2E: Loading, Match Extraction, Formatting, Deduplication, and Focus Restoration', async ({ page }) => {
  // Go to Regex Extractor tool
  await page.goto('http://localhost:5173/en/outil/regex-extractor');

  // Verify elements are visible
  const patternInput = page.locator('#extractor-pattern-input');
  const textInput = page.locator('#extractor-text-input');
  const textOutput = page.locator('#extractor-text-output');

  await expect(patternInput).toBeVisible();
  await expect(textInput).toBeVisible();
  await expect(textOutput).toBeVisible();

  // Wait for worker evaluation of default content
  // Default text: user_id=102&email=alice@example.com&role=admin...
  // Default pattern: (?<key>[a-zA-Z0-9_]+)=(?<value>[^&\s]+)
  // Default mode: template, and template is: $<key> -> $<value>
  // Let's verify that output contains formatted query string key-values
  await expect(textOutput).toHaveValue(/user_id -> 102/);
  await expect(textOutput).toHaveValue(/email -> alice@example\.com/);

  // 1. Change text input to a custom value
  const testText = 'ip=10.0.0.1&host=db_node&port=5432\nip=10.0.0.1&host=cache_node&port=6379';
  await textInput.fill(testText);

  // Check output
  await expect(textOutput).toHaveValue(/ip -> 10\.0\.0\.1/);
  await expect(textOutput).toHaveValue(/host -> db_node/);
  await expect(textOutput).toHaveValue(/port -> 5432/);

  // 2. Change Extract Mode to Named Group and extract 'value' group
  const namedGroupBtn = page.getByRole('button', { name: 'Named Group', exact: true });
  await namedGroupBtn.click();

  // Enter the named group name 'value'
  const namedGroupInput = page.locator('#named-group-input');
  await namedGroupInput.fill('value');

  // Verify only values are extracted
  await expect(textOutput).toHaveValue(/10\.0\.0\.1/);
  await expect(textOutput).toHaveValue(/db_node/);
  await expect(textOutput).not.toHaveValue(/ip ->/);

  // 3. Test Deduplication / Uniqueness Mode: Unique (CS)
  const uniqueCsBtn = page.getByRole('button', { name: 'Unique (CS)', exact: true });
  await uniqueCsBtn.click();

  // The first IP is duplicate, so unique values of group 'value' should contain 10.0.0.1 only once!
  // Count matches in output
  const outputVal = await textOutput.inputValue();
  const ipMatches = outputVal.match(/10\.0\.0\.1/g) || [];
  expect(ipMatches.length).toBe(1);

  // 4. Test Copy functionality
  const copyBtn = page.getByRole('button', { name: /Copy/ }).first();
  await copyBtn.click();

  // Verify that copy button changed text to 'Copied'
  await expect(page.locator('button:has-text("Copied")').first()).toBeVisible();

  // 5. Test Escape keyboard shortcut (local)
  await textInput.focus();
  await page.keyboard.press('Escape');

  // Verify input is empty and focused
  await expect(textInput).toHaveValue('');
  await expect(textInput).toBeFocused();
});
