import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test('text to speech tool accessibility', async ({ page }) => {
  await page.goto(`${BASE_URL}/en/outil/text-to-speech`);
  await expect(page.locator('h1')).toContainText('Text to Speech');
  await expect(page.getByLabel('Text to read')).toBeVisible();
});

test('diff checker tool options', async ({ page }) => {
  await page.goto(`${BASE_URL}/en/outil/diff-checker`);
  await expect(page.locator('h1')).toContainText('Diff Checker');
  await expect(page.getByText('Ignore Case')).toBeVisible();
  await expect(page.getByText('Ignore Whitespace')).toBeVisible();
});

test('speech to text tool accessibility', async ({ page }) => {
  await page.goto(`${BASE_URL}/en/outil/speech-to-text`);
  await expect(page.locator('h1')).toContainText('Speech to Text');
  await expect(page.getByRole('button', { name: 'Start Listening' })).toBeVisible();
});

test('iban generator tool accessibility', async ({ page }) => {
  await page.goto(`${BASE_URL}/en/outil/iban-generator`);
  await expect(page.locator('h1')).toContainText('IBAN Generator');
  await expect(page.getByText('Generate IBAN')).toBeVisible();
});

test('credit card generator tool accessibility', async ({ page }) => {
  await page.goto(`${BASE_URL}/en/outil/credit-card-generator`);
  await expect(page.locator('h1')).toContainText('Credit Card Generator');
  await expect(page.getByText('Generate Card')).toBeVisible();
});
