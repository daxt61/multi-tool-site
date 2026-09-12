import { test, expect } from '@playwright/test';

test.describe('Sentinel: JSONToRuby Breakout Security Test', () => {
  test('should sanitize malicious JSON keys containing quotes, newlines, and string interpolation', async ({ page }) => {
    await page.goto('http://localhost:4173/fr/outil/json-to-ruby');

    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();

    const maliciousJson = JSON.stringify({
      'user"name': 'Alice',
      'bad_key\n  def hack...': 'value',
      '#{system("calc")}': 'payload',
      'class': 'keyword',
      '123_numeric': 'digit_start',
      '###': 'symbols_only'
    });

    await jsonInput.fill(maliciousJson);

    const rubyOutput = page.locator('#ruby-output');
    await expect(rubyOutput).not.toBeEmpty();

    const text = await rubyOutput.inputValue();

    // Verify sanitized outputs:
    // 'user"name' => user_name
    // 'bad_key\n  def hack...' => bad_key_def_hack
    // '#{system("calc")}' => system_calc
    // 'class' => class_
    // '123_numeric' => r_123_numeric
    // '###' => property
    expect(text).toContain('attr_accessor :user_name, :bad_key_def_hack, :system_calc, :class_, :r_123_numeric, :property');
    expect(text).toContain('def initialize(user_name:, bad_key_def_hack:, system_calc:, class_:, r_123_numeric:, property:)');
    expect(text).not.toContain('user"name');
    expect(text).not.toContain('\n  def hack');
    expect(text).not.toContain('#{system');
  });
});
