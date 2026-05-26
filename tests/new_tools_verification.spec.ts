import { test, expect } from '@playwright/test';

test('verify sql-to-json and ua-generator tools', async ({ page }) => {
  await page.goto('http://localhost:5173/en');

  // Check if new tools are in the dashboard
  await expect(page.getByRole('heading', { name: 'SQL to JSON' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'User Agent Generator' })).toBeVisible();

  // Test SQL to JSON
  await page.goto('http://localhost:5173/en/outil/sql-to-json');
  await page.fill('textarea#sql-input', "INSERT INTO users (id, name) VALUES (1, 'Jules');");
  await page.click('button:has-text("Convert to JSON")');
  const jsonOutput = await page.inputValue('textarea#json-output');
  expect(jsonOutput).toContain('"name": "Jules"');

  // Test UA Generator
  await page.goto('http://localhost:5173/en/outil/ua-generator');
  await expect(page.getByText('Generated User Agent')).toBeVisible();
  const uaText = await page.locator('p.font-mono').textContent();
  expect(uaText?.length).toBeGreaterThan(10);

  // Test Diff Checker Upgrades
  await page.goto('http://localhost:5173/en/outil/diff-checker');
  await page.fill('#text1', 'Line 1\nLine 2');
  await page.fill('#text2', 'Line 1\nLine 3');
  await page.click('button:has-text("Split")');
  await expect(page.locator('span.whitespace-pre:has-text("Line 2")')).toBeVisible();
  await expect(page.locator('span.whitespace-pre:has-text("Line 3")')).toBeVisible();
});
