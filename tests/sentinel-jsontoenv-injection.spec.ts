import { test, expect } from '@playwright/test';

test('JSONToEnv should sanitize keys and escape newline/carriage return values to prevent injection', async ({ page }) => {
  await page.goto('http://localhost:5173/fr/outil/json-to-env');

  // Wait for the tool to load
  await page.waitForSelector('textarea#json-input');

  // Input JSON with malicious keys and multiline values
  const maliciousJSON = JSON.stringify({
    "database\nurl": "postgres://localhost/db",
    "normal_key": "line1\nline2\rline3",
    "another=key": "secret value"
  }, null, 2);

  await page.fill('textarea#json-input', maliciousJSON);

  // Get ENV output
  const envOutput = await page.inputValue('textarea#env-output');

  // Verify that the newline/equals key is sanitized to alphanumeric/underscores
  expect(envOutput).toContain('DATABASE_URL=');
  expect(envOutput).toContain('ANOTHER_KEY=');

  // Verify that the multiline value is safely quoted and escaped
  expect(envOutput).toContain('NORMAL_KEY="line1\\nline2\\rline3"');

  // Ensure there are no unescaped/unquoted newline breakouts
  const lines = envOutput.split('\n').map(l => l.trim()).filter(Boolean);
  expect(lines.every(line => {
    // Each line should be KEY=VALUE or a comment, not an orphaned line or loose string
    return /^[A-Z0-9_]+=.+$/.test(line) || line.startsWith('#');
  })).toBe(true);
});
