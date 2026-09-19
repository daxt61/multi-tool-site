import { test, expect } from '@playwright/test';

test.describe('Sentinel: JSONToProperties Breakout Security Test', () => {
  test('should escape comment characters, equal signs, and delimiters in properties keys and values', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/json-to-properties');

    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();

    const maliciousJson = JSON.stringify({
      '#comment_key': 'secret_comment',
      '!exclamation_key': 'secret_exclamation',
      'key=injected': 'value=equals',
      'key:colon': 'value:colon',
      'space key': 'space value\nnewline_val'
    });

    await jsonInput.fill(maliciousJson);

    const propertiesOutput = page.locator('#properties-output');
    await expect(propertiesOutput).not.toBeEmpty();

    const text = await propertiesOutput.inputValue();

    // Verify sanitized/escaped keys and values
    expect(text).toContain('\\#comment_key=secret_comment');
    expect(text).toContain('\\!exclamation_key=secret_exclamation');
    expect(text).toContain('key\\=injected=value=equals');
    expect(text).toContain('key\\:colon=value:colon');
    expect(text).toContain('space\\ key=space value\\nnewline_val');
  });
});
