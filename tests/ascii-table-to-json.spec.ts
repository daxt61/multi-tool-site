import { test, expect } from '@playwright/test';

test.describe('ASCII Table to JSON Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/en/outil/ascii-table-to-json');
  });

  test('should convert a simple Markdown table to JSON', async ({ page }) => {
    const input = `| Name | Age |
|------|-----|
| John | 30 |
| Jane | 25 |`;

    await page.fill('#table-input', input);

    // Wait for the output to update
    await page.waitForTimeout(500);

    const output = await page.inputValue('#json-output');
    const parsed = JSON.parse(output);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].Name).toBe('John');
    expect(parsed[0].Age).toBe(30);
    expect(parsed[1].Name).toBe('Jane');
    expect(parsed[1].Age).toBe(25);
  });

  test('should convert an ASCII table with borders to JSON', async ({ page }) => {
    const input = `+--------+-------+
| Header | Value |
+--------+-------+
| Test 1 | true  |
| Test 2 | 123.4 |
+--------+-------+`;

    await page.fill('#table-input', input);

    // Wait for the output to update
    await page.waitForTimeout(500);

    const output = await page.inputValue('#json-output');
    const parsed = JSON.parse(output);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].Header).toBe('Test 1');
    expect(parsed[0].Value).toBe(true);
    expect(parsed[1].Header).toBe('Test 2');
    expect(parsed[1].Value).toBe(123.4);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.fill('#table-input', '| A | B |\n| 1 | 2 |');

    // Test Escape to clear.
    await page.keyboard.press('Escape');
    expect(await page.inputValue('#table-input')).toBe('');
  });
});
