import { test, expect } from '@playwright/test';

test.describe('New JSON Converters', () => {
  const jsonInput = '{"id": 1, "name": "John", "active": true, "tags": ["a", "b"], "meta": {"foo": "bar"}}';

  test('JSON to Python works', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/json-to-python');
    await page.fill('#json-input', jsonInput);
    const output = await page.inputValue('#python-output');
    expect(output).toContain('@dataclass');
    expect(output).toContain('class RootObject:');
    expect(output).toContain('class Meta:');
  });

  test('JSON to Rust works', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/json-to-rust');
    await page.fill('#json-input', jsonInput);
    const output = await page.inputValue('#rust-output');
    expect(output).toContain('pub struct RootObject');
    expect(output).toContain('pub struct Meta');
    expect(output).toContain('#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]');
  });

  test('JSON to PHP works', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/json-to-php');
    await page.fill('#json-input', jsonInput);
    const output = await page.inputValue('#php-output');
    expect(output).toContain('class RootObject');
    expect(output).toContain('class Meta');
    expect(output).toContain('public string $name;');
  });

  test('JSON to Kotlin works', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/json-to-kotlin');
    await page.fill('#json-input', jsonInput);
    const output = await page.inputValue('#kotlin-output');
    expect(output).toContain('data class RootObject');
    expect(output).toContain('data class Meta');
  });

  test('JSON to Dart works', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/json-to-dart');
    await page.fill('#json-input', jsonInput);
    const output = await page.inputValue('#dart-output');
    expect(output).toContain('class RootObject');
    expect(output).toContain('class Meta');
    expect(output).toContain('Map<String, dynamic> toJson()');
  });
});

test.describe('Upgraded Tools', () => {
  test('Word Counter has Gunning Fog', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/word-counter');
    await page.fill('#word-counter-input', 'This is a test of the emergency broadcast system. It is only a test.');
    await expect(page.getByText('Gunning Fog')).toBeVisible();
  });

  test('Password Generator passphrase mode uses English in EN locale', async ({ page }) => {
    await page.goto('http://localhost:4173/en/outil/password-generator');
    await page.click('button:has-text("Memorable")');
    // Toggle visibility to make it type="text"
    await page.click('button[aria-label^="Show"]');
    // Regenerate a few times to increase chance of seeing an English word if it was bugged
    for(let i=0; i<3; i++) {
        await page.click('button[aria-label^="Regenerate"]');
        const password = await page.inputValue('input[type="text"]');
        // Simple check: check if any part of the password (separated by -) is in WORDS_EN
        // Since we don't have access to WORDS_EN in the test easily, we just check for common English words
        // or check it doesn't contain common French words like 'bleu', 'rouge'.
        const parts = password.split('-');
        const frenchWords = ['bleu', 'rouge', 'vert', 'jaune', 'noir', 'blanc'];
        parts.forEach(part => {
            expect(frenchWords).not.toContain(part.toLowerCase());
        });
    }
  });
});
